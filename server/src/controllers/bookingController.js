const { db } = require('../db');

function parseSlotTimeToMinutes(timeStr) {
  const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return 0;
  let [_, h, m, meridiem] = match;
  let hours = parseInt(h, 10);
  const minutes = parseInt(m, 10);
  if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

exports.createBooking = (req, res) => {
  try {
    const {
      date,
      lab_id,
      slot_id,
      faculty_id,
      department_id,
      year_id,
      batch_id,
      subject_id,
      subject_code,
      expected_students,
      remarks,
      on_behalf_user_id
    } = req.body;

    const isAdmin = req.user.role === 'administrator';

    // 1. Mandatory input validations
    if (!date || !lab_id || !slot_id || !faculty_id || !department_id || !year_id || !batch_id || !subject_id) {
      return res.status(400).json({
        error: 'Missing required booking details. Date, Lab, Period, Faculty, Department, Year, Batch, and Subject are all required.'
      });
    }

    // 2. Validate lab existence and status
    const lab = db.prepare('SELECT id, lab_name, capacity, status FROM labs WHERE id = ?').get(lab_id);
    if (!lab) {
      return res.status(404).json({ error: 'Selected laboratory does not exist.' });
    }
    if (lab.status !== 'active') {
      return res.status(400).json({ error: `Laboratory '${lab.lab_name}' is currently inactive and cannot be booked.` });
    }

    // 3. Validate time slot
    const slot = db.prepare('SELECT id, period, start_time, end_time, bookable FROM time_slots WHERE id = ?').get(slot_id);
    if (!slot) {
      return res.status(404).json({ error: 'Selected time period does not exist.' });
    }
    if (!slot.bookable) {
      return res.status(400).json({ error: `Period ${slot.period} (Lunch Break 1:00 PM – 2:00 PM) is non-bookable.` });
    }

    // 4. Validate past date/slot for normal users
    const todayStr = new Date().toISOString().split('T')[0];
    if (!isAdmin) {
      if (date < todayStr) {
        return res.status(400).json({ error: 'Cannot book laboratory sessions for past dates.' });
      }
      if (date === todayStr) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const slotStartMinutes = parseSlotTimeToMinutes(slot.start_time);
        if (slotStartMinutes <= currentMinutes) {
          return res.status(400).json({ error: 'This time period has already commenced or passed today.' });
        }
      }
    }

    // 5. Capacity validation if expected students provided
    if (expected_students) {
      const studentCount = parseInt(expected_students, 10);
      if (studentCount > lab.capacity) {
        return res.status(400).json({
          error: `Expected student count (${studentCount}) exceeds laboratory capacity (${lab.capacity}).`
        });
      }
    }

    // 6. Check booked_by user ID (Admin can book on behalf of another user)
    let finalBookedBy = req.user.id;
    if (isAdmin && on_behalf_user_id) {
      const targetUser = db.prepare('SELECT id, name FROM users WHERE id = ?').get(on_behalf_user_id);
      if (!targetUser) {
        return res.status(404).json({ error: 'Specified user for on-behalf booking was not found.' });
      }
      finalBookedBy = targetUser.id;
    }

    // Get subject code if not passed
    let finalSubjectCode = subject_code;
    if (!finalSubjectCode) {
      const sub = db.prepare('SELECT code FROM subjects WHERE id = ?').get(subject_id);
      finalSubjectCode = sub ? sub.code : '';
    }

    // 7. Atomic transaction execution with database-level uniqueness enforcement
    const bookingTx = db.transaction(() => {
      // Check existing active booking explicitly
      const existing = db.prepare(`
        SELECT id, booking_id FROM bookings
        WHERE lab_id = ? AND date = ? AND slot_id = ? AND status = 'BOOKED'
      `).get(lab_id, date, slot_id);

      if (existing) {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      // Generate sequence-based unique booking ID
      const maxIdRow = db.prepare('SELECT MAX(id) as max_id FROM bookings').get();
      const nextNum = (maxIdRow.max_id || 0) + 1;
      const bookingId = `LAB-${String(nextNum).padStart(6, '0')}`;

      // Insert into bookings table
      const info = db.prepare(`
        INSERT INTO bookings (
          booking_id, date, lab_id, slot_id, faculty_id, department_id, year_id, batch_id,
          subject_id, subject_code, expected_students, remarks, booked_by, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'BOOKED')
      `).run(
        bookingId,
        date,
        lab_id,
        slot_id,
        faculty_id,
        department_id,
        year_id,
        batch_id,
        subject_id,
        finalSubjectCode || '',
        expected_students ? parseInt(expected_students, 10) : null,
        remarks ? remarks.trim() : '',
        finalBookedBy
      );

      // Log into audit trail
      const auditAction = (isAdmin && finalBookedBy !== req.user.id) ? 'ADMIN_BOOKING_CREATED' : 'CREATED';
      db.prepare(`
        INSERT INTO audit_logs (
          booking_id, action, performed_by, performed_by_name, performed_by_role, new_value, reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        bookingId,
        auditAction,
        req.user.id,
        req.user.name,
        req.user.role,
        JSON.stringify({ lab: lab.lab_name, date, period: slot.period, faculty_id, subject_id }),
        isAdmin && finalBookedBy !== req.user.id ? `Admin booked on behalf of user ${finalBookedBy}` : 'Initial booking reservation'
      );

      return {
        id: info.lastInsertRowid,
        bookingId
      };
    });

    let createdResult;
    try {
      createdResult = bookingTx();
    } catch (txErr) {
      if (txErr.message === 'SLOT_ALREADY_BOOKED' || txErr.code === 'SQLITE_CONSTRAINT_UNIQUE' || (txErr.message && txErr.message.includes('UNIQUE constraint failed'))) {
        return res.status(409).json({
          error: 'Sorry. This slot has just been booked by another user. Please select another available slot.'
        });
      }
      throw txErr;
    }

    // Fetch complete newly created booking record
    const fullBooking = db.prepare(`
      SELECT b.*,
             l.lab_name, l.capacity, l.building_block, l.room_number,
             s.period, s.start_time, s.end_time,
             f.name as faculty_name,
             d.name as department_name, d.code as department_code,
             y.year_name,
             bs.section_name,
             sub.name as subject_name,
             u.name as booked_by_name, u.email as booked_by_email
      FROM bookings b
      JOIN labs l ON b.lab_id = l.id
      JOIN time_slots s ON b.slot_id = s.id
      JOIN faculty f ON b.faculty_id = f.id
      JOIN departments d ON b.department_id = d.id
      JOIN years y ON b.year_id = y.id
      JOIN batches_sections bs ON b.batch_id = bs.id
      JOIN subjects sub ON b.subject_id = sub.id
      JOIN users u ON b.booked_by = u.id
      WHERE b.id = ?
    `).get(createdResult.id);

    return res.status(201).json({
      success: true,
      message: 'Laboratory booking confirmed successfully!',
      booking: fullBooking
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    return res.status(500).json({ error: 'Failed to process booking transaction.' });
  }
};

exports.getMyBookings = (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT b.*,
             l.lab_name, l.capacity, l.building_block, l.room_number,
             s.period, s.start_time, s.end_time,
             f.name as faculty_name,
             d.name as department_name, d.code as department_code,
             y.year_name,
             bs.section_name,
             sub.name as subject_name
      FROM bookings b
      JOIN labs l ON b.lab_id = l.id
      JOIN time_slots s ON b.slot_id = s.id
      JOIN faculty f ON b.faculty_id = f.id
      JOIN departments d ON b.department_id = d.id
      JOIN years y ON b.year_id = y.id
      JOIN batches_sections bs ON b.batch_id = bs.id
      JOIN subjects sub ON b.subject_id = sub.id
      WHERE b.booked_by = ?
    `;
    const params = [req.user.id];

    if (status && status !== 'ALL') {
      query += ` AND b.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (b.booking_id LIKE ? OR l.lab_name LIKE ? OR sub.name LIKE ? OR f.name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY b.date DESC, s.display_order ASC`;

    const bookings = db.prepare(query).all(...params);
    return res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    console.error('Error fetching my bookings:', err);
    return res.status(500).json({ error: 'Failed to retrieve your bookings.' });
  }
};

exports.getAllBookings = (req, res) => {
  try {
    const {
      date,
      startDate,
      endDate,
      lab_id,
      department_id,
      faculty_id,
      year_id,
      batch_id,
      subject_id,
      status,
      search,
      page = 1,
      limit = 25
    } = req.query;

    let query = `
      SELECT b.*,
             l.lab_name, l.capacity, l.building_block, l.room_number,
             s.period, s.start_time, s.end_time,
             f.name as faculty_name,
             d.name as department_name, d.code as department_code,
             y.year_name,
             bs.section_name,
             sub.name as subject_name,
             u.name as booked_by_name, u.email as booked_by_email, u.employee_id as booked_by_emp_id
      FROM bookings b
      JOIN labs l ON b.lab_id = l.id
      JOIN time_slots s ON b.slot_id = s.id
      JOIN faculty f ON b.faculty_id = f.id
      JOIN departments d ON b.department_id = d.id
      JOIN years y ON b.year_id = y.id
      JOIN batches_sections bs ON b.batch_id = bs.id
      JOIN subjects sub ON b.subject_id = sub.id
      JOIN users u ON b.booked_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ` AND b.date = ?`;
      params.push(date);
    } else {
      if (startDate) {
        query += ` AND b.date >= ?`;
        params.push(startDate);
      }
      if (endDate) {
        query += ` AND b.date <= ?`;
        params.push(endDate);
      }
    }

    if (lab_id && lab_id !== 'ALL') {
      query += ` AND b.lab_id = ?`;
      params.push(lab_id);
    }
    if (department_id && department_id !== 'ALL') {
      query += ` AND b.department_id = ?`;
      params.push(department_id);
    }
    if (faculty_id && faculty_id !== 'ALL') {
      query += ` AND b.faculty_id = ?`;
      params.push(faculty_id);
    }
    if (year_id && year_id !== 'ALL') {
      query += ` AND b.year_id = ?`;
      params.push(year_id);
    }
    if (batch_id && batch_id !== 'ALL') {
      query += ` AND b.batch_id = ?`;
      params.push(batch_id);
    }
    if (subject_id && subject_id !== 'ALL') {
      query += ` AND b.subject_id = ?`;
      params.push(subject_id);
    }
    if (status && status !== 'ALL') {
      query += ` AND b.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (b.booking_id LIKE ? OR l.lab_name LIKE ? OR f.name LIKE ? OR sub.name LIKE ? OR bs.section_name LIKE ? OR u.name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }

    // Count total matches
    const countSql = `SELECT COUNT(*) as total FROM (${query})`;
    const totalRow = db.prepare(countSql).get(...params);
    const total = totalRow ? totalRow.total : 0;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const offset = (pageNum - 1) * limitNum;

    query += ` ORDER BY b.date DESC, s.display_order ASC LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const bookings = db.prepare(query).all(...params);

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      bookings
    });
  } catch (err) {
    console.error('Error fetching all bookings:', err);
    return res.status(500).json({ error: 'Failed to retrieve bookings list.' });
  }
};

exports.cancelBooking = (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const isAdmin = req.user.role === 'administrator';

    const booking = db.prepare(`
      SELECT b.*, l.lab_name, s.period
      FROM bookings b
      JOIN labs l ON b.lab_id = l.id
      JOIN time_slots s ON b.slot_id = s.id
      WHERE b.id = ?
    `).get(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'This booking has already been cancelled.' });
    }

    // Security check: Normal users can only cancel their OWN bookings!
    if (!isAdmin && booking.booked_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You can only cancel laboratory bookings that you created.' });
    }

    const cancelTx = db.transaction(() => {
      db.prepare(`
        UPDATE bookings
        SET status = 'CANCELLED',
            cancellation_reason = ?,
            cancelled_by = ?,
            cancelled_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        reason ? reason.trim() : (isAdmin ? 'Cancelled by Administrator' : 'Cancelled by Faculty User'),
        req.user.id,
        id
      );

      // Audit Log
      db.prepare(`
        INSERT INTO audit_logs (
          booking_id, action, performed_by, performed_by_name, performed_by_role, old_value, new_value, reason
        ) VALUES (?, 'CANCELLED', ?, ?, ?, ?, 'CANCELLED', ?)
      `).run(
        booking.booking_id,
        req.user.id,
        req.user.name,
        req.user.role,
        'BOOKED',
        reason ? reason.trim() : 'Reservation cancelled'
      );
    });

    cancelTx();

    return res.json({
      success: true,
      message: `Booking ${booking.booking_id} cancelled successfully. The slot is now available.`,
      bookingId: booking.booking_id
    });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    return res.status(500).json({ error: 'Failed to cancel booking.' });
  }
};

exports.adminUpdateBooking = (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      lab_id,
      slot_id,
      faculty_id,
      department_id,
      year_id,
      batch_id,
      subject_id,
      subject_code,
      expected_students,
      remarks,
      reason
    } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'A justification / reason is mandatory when an administrator modifies a booking.' });
    }

    const existing = db.prepare(`
      SELECT b.*, l.lab_name, s.period
      FROM bookings b
      JOIN labs l ON b.lab_id = l.id
      JOIN time_slots s ON b.slot_id = s.id
      WHERE b.id = ?
    `).get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const targetDate = date || existing.date;
    const targetLabId = lab_id || existing.lab_id;
    const targetSlotId = slot_id || existing.slot_id;

    // Check conflict if slot/lab/date changed
    if (targetDate !== existing.date || targetLabId !== existing.lab_id || targetSlotId !== existing.slot_id) {
      const conflict = db.prepare(`
        SELECT id, booking_id FROM bookings
        WHERE lab_id = ? AND date = ? AND slot_id = ? AND status = 'BOOKED' AND id != ?
      `).get(targetLabId, targetDate, targetSlotId, id);

      if (conflict) {
        return res.status(409).json({
          error: `Cannot reschedule: Target slot is already booked (${conflict.booking_id}).`
        });
      }
    }

    const updateTx = db.transaction(() => {
      db.prepare(`
        UPDATE bookings
        SET date = ?, lab_id = ?, slot_id = ?, faculty_id = ?, department_id = ?,
            year_id = ?, batch_id = ?, subject_id = ?, subject_code = ?,
            expected_students = ?, remarks = ?, modified_by = ?, modified_at = CURRENT_TIMESTAMP,
            modification_reason = ?
        WHERE id = ?
      `).run(
        targetDate,
        targetLabId,
        targetSlotId,
        faculty_id || existing.faculty_id,
        department_id || existing.department_id,
        year_id || existing.year_id,
        batch_id || existing.batch_id,
        subject_id || existing.subject_id,
        subject_code !== undefined ? subject_code : existing.subject_code,
        expected_students !== undefined ? expected_students : existing.expected_students,
        remarks !== undefined ? remarks : existing.remarks,
        req.user.id,
        reason.trim(),
        id
      );

      db.prepare(`
        INSERT INTO audit_logs (
          booking_id, action, performed_by, performed_by_name, performed_by_role, old_value, new_value, reason
        ) VALUES (?, 'MODIFIED', ?, ?, ?, ?, ?, ?)
      `).run(
        existing.booking_id,
        req.user.id,
        req.user.name,
        req.user.role,
        JSON.stringify({ date: existing.date, lab_id: existing.lab_id, slot_id: existing.slot_id, period: existing.period }),
        JSON.stringify({ date: targetDate, lab_id: targetLabId, slot_id: targetSlotId }),
        reason.trim()
      );
    });

    updateTx();

    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    return res.json({
      success: true,
      message: `Booking ${existing.booking_id} modified successfully.`,
      booking: updated
    });
  } catch (err) {
    console.error('Error modifying booking:', err);
    return res.status(500).json({ error: 'Failed to modify booking.' });
  }
};

exports.adminDeleteBooking = (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const deleteTx = db.transaction(() => {
      // Record in audit log before hard deletion
      db.prepare(`
        INSERT INTO audit_logs (
          booking_id, action, performed_by, performed_by_name, performed_by_role, old_value, new_value, reason
        ) VALUES (?, 'DELETED', ?, ?, ?, ?, 'PURGED', ?)
      `).run(
        existing.booking_id,
        req.user.id,
        req.user.name,
        req.user.role,
        JSON.stringify(existing),
        reason ? reason.trim() : 'Permanently removed by Administrator'
      );

      db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
    });

    deleteTx();

    return res.json({
      success: true,
      message: `Booking ${existing.booking_id} permanently removed.`
    });
  } catch (err) {
    console.error('Error deleting booking:', err);
    return res.status(500).json({ error: 'Failed to delete booking record.' });
  }
};
