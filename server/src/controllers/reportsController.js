const { db } = require('../db');
const xlsx = require('xlsx');

// 1. Daily Lab Schedule Report
exports.getDailyScheduleReport = (req, res) => {
  try {
    const { date, department_id, lab_id } = req.query;
    const queryDate = date || new Date().toISOString().split('T')[0];

    let query = `
      SELECT b.booking_id, b.date,
             l.lab_name, l.capacity, l.building_block, l.room_number,
             s.period, s.start_time, s.end_time,
             f.name as faculty_name,
             d.name as department_name, d.code as department_code,
             y.year_name,
             bs.section_name,
             sub.name as subject_name, sub.code as subject_code,
             b.status, b.expected_students, b.remarks,
             u.name as booked_by_name
      FROM bookings b
      JOIN labs l ON b.lab_id = l.id
      JOIN time_slots s ON b.slot_id = s.id
      JOIN faculty f ON b.faculty_id = f.id
      JOIN departments d ON b.department_id = d.id
      JOIN years y ON b.year_id = y.id
      JOIN batches_sections bs ON b.batch_id = bs.id
      JOIN subjects sub ON b.subject_id = sub.id
      JOIN users u ON b.booked_by = u.id
      WHERE b.date = ?
    `;
    const params = [queryDate];

    if (department_id && department_id !== 'ALL') {
      query += ` AND b.department_id = ?`;
      params.push(department_id);
    }
    if (lab_id && lab_id !== 'ALL') {
      query += ` AND b.lab_id = ?`;
      params.push(lab_id);
    }

    query += ` ORDER BY l.id ASC, s.display_order ASC`;

    const records = db.prepare(query).all(...params);
    return res.json({ success: true, date: queryDate, total: records.length, records });
  } catch (err) {
    console.error('Error fetching daily schedule report:', err);
    return res.status(500).json({ error: 'Failed to generate daily schedule report.' });
  }
};

// 2. Date-Range Booking Report
exports.getDateRangeReport = (req, res) => {
  try {
    const { startDate, endDate, department_id, lab_id, status } = req.query;
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || start;

    let query = `
      SELECT b.booking_id, b.date,
             l.lab_name, l.capacity,
             s.period, s.start_time, s.end_time,
             f.name as faculty_name,
             d.code as department_code,
             y.year_name,
             bs.section_name,
             sub.name as subject_name,
             b.status, b.created_at,
             u.name as booked_by_name
      FROM bookings b
      JOIN labs l ON b.lab_id = l.id
      JOIN time_slots s ON b.slot_id = s.id
      JOIN faculty f ON b.faculty_id = f.id
      JOIN departments d ON b.department_id = d.id
      JOIN years y ON b.year_id = y.id
      JOIN batches_sections bs ON b.batch_id = bs.id
      JOIN subjects sub ON b.subject_id = sub.id
      JOIN users u ON b.booked_by = u.id
      WHERE b.date >= ? AND b.date <= ?
    `;
    const params = [start, end];

    if (department_id && department_id !== 'ALL') {
      query += ` AND b.department_id = ?`;
      params.push(department_id);
    }
    if (lab_id && lab_id !== 'ALL') {
      query += ` AND b.lab_id = ?`;
      params.push(lab_id);
    }
    if (status && status !== 'ALL') {
      query += ` AND b.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY b.date DESC, s.display_order ASC`;

    const records = db.prepare(query).all(...params);
    return res.json({ success: true, startDate: start, endDate: end, total: records.length, records });
  } catch (err) {
    console.error('Error fetching date range report:', err);
    return res.status(500).json({ error: 'Failed to generate date-range report.' });
  }
};

// 3. Lab Utilization Report
exports.getLabUtilizationReport = (req, res) => {
  try {
    const { startDate, endDate, department_id } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || today;
    const end = endDate || today;

    // Calculate number of calendar days between start and end inclusive
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = Math.abs(d2 - d1);
    const numDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Exactly 7 bookable periods per day
    const bookableSlotsPerDay = 7;
    const totalPeriodsPerLab = numDays * bookableSlotsPerDay;

    let labQuery = `
      SELECT l.id, l.lab_name, l.department, l.capacity, l.building_block
      FROM labs l
      WHERE l.status = 'active'
    `;
    const labParams = [];
    if (department_id && department_id !== 'ALL') {
      labQuery += ` AND (l.department = ? OR l.department_id = ?)`;
      labParams.push(department_id, department_id);
    }
    labQuery += ` ORDER BY l.id ASC`;

    const labs = db.prepare(labQuery).all(...labParams);

    // Count booked slots for each lab in this date range
    const bookedCounts = db.prepare(`
      SELECT lab_id, COUNT(*) as booked_count
      FROM bookings
      WHERE date >= ? AND date <= ? AND status = 'BOOKED'
      GROUP BY lab_id
    `).all(start, end);

    const bookedMap = {};
    for (const row of bookedCounts) {
      bookedMap[row.lab_id] = row.booked_count;
    }

    const report = labs.map(lab => {
      const booked = bookedMap[lab.id] || 0;
      const available = Math.max(0, totalPeriodsPerLab - booked);
      const utilization = totalPeriodsPerLab > 0 ? Number(((booked / totalPeriodsPerLab) * 100).toFixed(1)) : 0;
      return {
        labId: lab.id,
        labName: lab.lab_name,
        department: lab.department,
        capacity: lab.capacity,
        totalPeriods: totalPeriodsPerLab,
        bookedPeriods: booked,
        availablePeriods: available,
        utilizationPercentage: utilization
      };
    });

    return res.json({
      success: true,
      startDate: start,
      endDate: end,
      daysCount: numDays,
      bookablePeriodsPerDay: bookableSlotsPerDay,
      records: report
    });
  } catch (err) {
    console.error('Error fetching utilization report:', err);
    return res.status(500).json({ error: 'Failed to generate lab utilization report.' });
  }
};

// 4. Faculty Usage Report
exports.getFacultyUsageReport = (req, res) => {
  try {
    const { startDate, endDate, department_id } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || today;
    const end = endDate || today;

    let query = `
      SELECT f.id as faculty_id, f.name as faculty_name, f.designation,
             d.name as department_name, d.code as department_code,
             COUNT(CASE WHEN b.status = 'BOOKED' THEN 1 END) as completed_sessions,
             COUNT(CASE WHEN b.status = 'CANCELLED' THEN 1 END) as cancelled_sessions,
             COUNT(b.id) as total_bookings
      FROM faculty f
      JOIN departments d ON f.department_id = d.id
      LEFT JOIN bookings b ON b.faculty_id = f.id AND b.date >= ? AND b.date <= ?
      WHERE f.status = 'active'
    `;
    const params = [start, end];

    if (department_id && department_id !== 'ALL') {
      query += ` AND f.department_id = ?`;
      params.push(department_id);
    }

    query += ` GROUP BY f.id ORDER BY completed_sessions DESC, f.name ASC`;

    const records = db.prepare(query).all(...params);
    return res.json({ success: true, startDate: start, endDate: end, total: records.length, records });
  } catch (err) {
    console.error('Error fetching faculty usage report:', err);
    return res.status(500).json({ error: 'Failed to generate faculty usage report.' });
  }
};

// 5. Department Usage Report
exports.getDepartmentUsageReport = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || today;
    const end = endDate || today;

    const query = `
      SELECT d.id as department_id, d.name as department_name, d.code as department_code,
             COUNT(CASE WHEN b.status = 'BOOKED' THEN 1 END) as active_bookings,
             COUNT(CASE WHEN b.status = 'CANCELLED' THEN 1 END) as cancelled_bookings,
             COUNT(b.id) as total_requests
      FROM departments d
      LEFT JOIN bookings b ON b.department_id = d.id AND b.date >= ? AND b.date <= ?
      WHERE d.status = 'active'
      GROUP BY d.id
      ORDER BY active_bookings DESC
    `;

    const records = db.prepare(query).all(start, end);
    return res.json({ success: true, startDate: start, endDate: end, records });
  } catch (err) {
    console.error('Error fetching department usage report:', err);
    return res.status(500).json({ error: 'Failed to generate department usage report.' });
  }
};

// 6. Cancelled Bookings Report
exports.getCancelledBookingsReport = (req, res) => {
  try {
    const { startDate, endDate, department_id, lab_id } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || '2020-01-01';
    const end = endDate || today;

    let query = `
      SELECT b.booking_id, b.date,
             l.lab_name,
             s.period, s.start_time, s.end_time,
             f.name as faculty_name,
             d.code as department_code,
             sub.name as subject_name,
             b.cancellation_reason, b.cancelled_at,
             u.name as booked_by_name,
             cu.name as cancelled_by_name
      FROM bookings b
      JOIN labs l ON b.lab_id = l.id
      JOIN time_slots s ON b.slot_id = s.id
      JOIN faculty f ON b.faculty_id = f.id
      JOIN departments d ON b.department_id = d.id
      JOIN subjects sub ON b.subject_id = sub.id
      JOIN users u ON b.booked_by = u.id
      LEFT JOIN users cu ON b.cancelled_by = cu.id
      WHERE b.status = 'CANCELLED' AND b.date >= ? AND b.date <= ?
    `;
    const params = [start, end];

    if (department_id && department_id !== 'ALL') {
      query += ` AND b.department_id = ?`;
      params.push(department_id);
    }
    if (lab_id && lab_id !== 'ALL') {
      query += ` AND b.lab_id = ?`;
      params.push(lab_id);
    }

    query += ` ORDER BY b.cancelled_at DESC`;

    const records = db.prepare(query).all(...params);
    return res.json({ success: true, startDate: start, endDate: end, total: records.length, records });
  } catch (err) {
    console.error('Error fetching cancelled bookings report:', err);
    return res.status(500).json({ error: 'Failed to generate cancelled bookings report.' });
  }
};

// --- EXPORT API: CSV & EXCEL (.xlsx) ---
exports.exportReport = (req, res) => {
  try {
    const { format = 'csv', type = 'date-range' } = req.query;
    let data = [];
    let filename = `svec_report_${type}_${Date.now()}`;

    if (type === 'daily-schedule') {
      const result = db.prepare(`
        SELECT b.booking_id as "Booking ID", b.date as "Date", l.lab_name as "Laboratory",
               s.period as "Period", s.start_time || ' - ' || s.end_time as "Time Slot",
               f.name as "Faculty", d.code as "Department", y.year_name as "Year",
               bs.section_name as "Section", sub.name as "Subject", b.status as "Status"
        FROM bookings b
        JOIN labs l ON b.lab_id = l.id
        JOIN time_slots s ON b.slot_id = s.id
        JOIN faculty f ON b.faculty_id = f.id
        JOIN departments d ON b.department_id = d.id
        JOIN years y ON b.year_id = y.id
        JOIN batches_sections bs ON b.batch_id = bs.id
        JOIN subjects sub ON b.subject_id = sub.id
        ORDER BY b.date DESC
      `).all();
      data = result;
    } else if (type === 'utilization') {
      const labs = db.prepare('SELECT id, lab_name, department, capacity FROM labs WHERE status = "active"').all();
      data = labs.map(lab => {
        const booked = db.prepare('SELECT COUNT(*) as c FROM bookings WHERE lab_id = ? AND status = "BOOKED"').get(lab.id).c;
        return {
          "Lab Name": lab.lab_name,
          "Department": lab.department,
          "Capacity": lab.capacity,
          "Total Booked Sessions": booked
        };
      });
    } else {
      // Default date-range bookings
      const result = db.prepare(`
        SELECT b.booking_id as "Booking ID", b.date as "Date", l.lab_name as "Laboratory",
               s.period as "Period", f.name as "Faculty", d.code as "Department",
               sub.name as "Subject", b.status as "Status", u.name as "Booked By"
        FROM bookings b
        JOIN labs l ON b.lab_id = l.id
        JOIN time_slots s ON b.slot_id = s.id
        JOIN faculty f ON b.faculty_id = f.id
        JOIN departments d ON b.department_id = d.id
        JOIN subjects sub ON b.subject_id = sub.id
        JOIN users u ON b.booked_by = u.id
        ORDER BY b.date DESC
      `).all();
      data = result;
    }

    if (format === 'xlsx') {
      const worksheet = xlsx.utils.json_to_sheet(data);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Report');
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    } else {
      // CSV format
      if (!data || data.length === 0) {
        return res.send('No data available');
      }
      const headers = Object.keys(data[0]);
      const csvRows = [];
      csvRows.push(headers.join(','));
      for (const row of data) {
        const values = headers.map(h => {
          const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
          return `"${val.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      }
      const csvString = csvRows.join('\n');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csvString);
    }
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ error: 'Failed to export report.' });
  }
};
