const { db } = require('../db');

exports.getAllLabs = (req, res) => {
  try {
    const { department, status, search } = req.query;
    let query = `
      SELECT l.*, d.name as department_name, d.code as department_code
      FROM labs l
      LEFT JOIN departments d ON l.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (department && department !== 'ALL') {
      query += ` AND (l.department = ? OR l.department_id = ?)`;
      params.push(department, department);
    }

    if (status && status !== 'ALL') {
      query += ` AND l.status = ?`;
      params.push(status);
    } else if (req.user && req.user.role !== 'administrator') {
      // Normal users only see active labs by default unless specified
      query += ` AND l.status = 'active'`;
    }

    if (search) {
      query += ` AND (l.lab_name LIKE ? OR l.lab_id LIKE ? OR l.building_block LIKE ? OR l.department LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY l.id ASC`;

    const labs = db.prepare(query).all(...params);
    return res.json({ success: true, count: labs.length, labs });
  } catch (err) {
    console.error('Error fetching labs:', err);
    return res.status(500).json({ error: 'Failed to retrieve laboratories.' });
  }
};

exports.getLabById = (req, res) => {
  try {
    const { id } = req.params;
    const lab = db.prepare(`
      SELECT l.*, d.name as department_name, d.code as department_code
      FROM labs l
      LEFT JOIN departments d ON l.department_id = d.id
      WHERE l.id = ?
    `).get(id);

    if (!lab) {
      return res.status(404).json({ error: 'Laboratory not found.' });
    }

    // Get upcoming 5 bookings for this lab
    const upcomingBookings = db.prepare(`
      SELECT b.id, b.booking_id, b.date, b.status,
             s.period, s.start_time, s.end_time,
             f.name as faculty_name,
             sub.name as subject_name
      FROM bookings b
      JOIN time_slots s ON b.slot_id = s.id
      JOIN faculty f ON b.faculty_id = f.id
      JOIN subjects sub ON b.subject_id = sub.id
      WHERE b.lab_id = ? AND b.status = 'BOOKED'
      ORDER BY b.date DESC, s.display_order ASC
      LIMIT 5
    `).all(id);

    return res.json({ success: true, lab, upcomingBookings });
  } catch (err) {
    console.error('Error fetching lab details:', err);
    return res.status(500).json({ error: 'Failed to retrieve laboratory details.' });
  }
};

exports.createLab = (req, res) => {
  try {
    const { lab_name, department, department_id, building_block, room_number, capacity, remarks } = req.body;

    if (!lab_name || !department || !capacity) {
      return res.status(400).json({ error: 'Lab name, department, and capacity are required.' });
    }

    const numCapacity = parseInt(capacity, 10);
    if (isNaN(numCapacity) || numCapacity <= 0) {
      return res.status(400).json({ error: 'Capacity must be a positive integer.' });
    }

    // Generate unique Lab ID
    const countRow = db.prepare('SELECT COUNT(*) as c FROM labs').get();
    const labId = `LAB-${String(countRow.c + 1).padStart(3, '0')}`;

    const info = db.prepare(`
      INSERT INTO labs (lab_id, lab_name, department, department_id, building_block, room_number, capacity, status, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(
      labId,
      lab_name.trim(),
      department.trim(),
      department_id || null,
      (building_block || '').trim(),
      (room_number || '').trim(),
      numCapacity,
      (remarks || '').trim()
    );

    const created = db.prepare('SELECT * FROM labs WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, message: 'Laboratory created successfully.', lab: created });
  } catch (err) {
    console.error('Error creating lab:', err);
    return res.status(500).json({ error: 'Failed to create laboratory.' });
  }
};

exports.updateLab = (req, res) => {
  try {
    const { id } = req.params;
    const { lab_name, department, department_id, building_block, room_number, capacity, status, remarks } = req.body;

    const existing = db.prepare('SELECT * FROM labs WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Laboratory not found.' });
    }

    const numCapacity = capacity !== undefined ? parseInt(capacity, 10) : existing.capacity;
    if (isNaN(numCapacity) || numCapacity <= 0) {
      return res.status(400).json({ error: 'Capacity must be a positive integer.' });
    }

    db.prepare(`
      UPDATE labs 
      SET lab_name = ?, department = ?, department_id = ?, building_block = ?, room_number = ?, 
          capacity = ?, status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      lab_name ? lab_name.trim() : existing.lab_name,
      department ? department.trim() : existing.department,
      department_id !== undefined ? department_id : existing.department_id,
      building_block !== undefined ? building_block.trim() : existing.building_block,
      room_number !== undefined ? room_number.trim() : existing.room_number,
      numCapacity,
      status || existing.status,
      remarks !== undefined ? remarks.trim() : existing.remarks,
      id
    );

    const updated = db.prepare('SELECT * FROM labs WHERE id = ?').get(id);
    return res.json({ success: true, message: 'Laboratory updated successfully.', lab: updated });
  } catch (err) {
    console.error('Error updating lab:', err);
    return res.status(500).json({ error: 'Failed to update laboratory.' });
  }
};

exports.toggleLabStatus = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id, status, lab_name FROM labs WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Laboratory not found.' });
    }

    const newStatus = existing.status === 'active' ? 'inactive' : 'active';
    db.prepare('UPDATE labs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, id);

    return res.json({
      success: true,
      message: `Laboratory '${existing.lab_name}' is now ${newStatus}.`,
      newStatus
    });
  } catch (err) {
    console.error('Error toggling lab status:', err);
    return res.status(500).json({ error: 'Failed to change laboratory status.' });
  }
};
