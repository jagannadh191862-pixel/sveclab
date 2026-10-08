const { db } = require('../db');

// --- DEPARTMENTS ---
exports.getDepartments = (req, res) => {
  try {
    const departments = db.prepare('SELECT * FROM departments ORDER BY id ASC').all();
    return res.json({ success: true, departments });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve departments.' });
  }
};

exports.createDepartment = (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Code and name are required.' });

    const exists = db.prepare('SELECT id FROM departments WHERE UPPER(code) = UPPER(?)').get(code.trim());
    if (exists) return res.status(409).json({ error: 'Department code already exists.' });

    const info = db.prepare('INSERT INTO departments (code, name) VALUES (?, ?)').run(code.trim().toUpperCase(), name.trim());
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, department: dept });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create department.' });
  }
};

exports.updateDepartment = (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, status } = req.body;
    const existing = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Department not found.' });

    db.prepare(`
      UPDATE departments 
      SET code = ?, name = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(
      code ? code.trim().toUpperCase() : existing.code,
      name ? name.trim() : existing.name,
      status || existing.status,
      id
    );

    const updated = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
    return res.json({ success: true, department: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update department.' });
  }
};

// --- YEARS ---
exports.getYears = (req, res) => {
  try {
    const years = db.prepare('SELECT * FROM years ORDER BY display_order ASC').all();
    return res.json({ success: true, years });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve academic years.' });
  }
};

exports.createYear = (req, res) => {
  try {
    const { year_name, display_order } = req.body;
    if (!year_name) return res.status(400).json({ error: 'Year name is required.' });

    const exists = db.prepare('SELECT id FROM years WHERE year_name = ?').get(year_name.trim());
    if (exists) return res.status(409).json({ error: 'Year name already exists.' });

    const info = db.prepare('INSERT INTO years (year_name, display_order) VALUES (?, ?)').run(year_name.trim(), display_order || 1);
    const yr = db.prepare('SELECT * FROM years WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, year: yr });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create year.' });
  }
};

exports.updateYear = (req, res) => {
  try {
    const { id } = req.params;
    const { year_name, display_order, status } = req.body;
    const existing = db.prepare('SELECT * FROM years WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Year not found.' });

    db.prepare(`
      UPDATE years 
      SET year_name = ?, display_order = ?, status = ?
      WHERE id = ?
    `).run(
      year_name ? year_name.trim() : existing.year_name,
      display_order !== undefined ? display_order : existing.display_order,
      status || existing.status,
      id
    );

    const updated = db.prepare('SELECT * FROM years WHERE id = ?').get(id);
    return res.json({ success: true, year: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update year.' });
  }
};

// --- BATCHES / SECTIONS ---
exports.getBatches = (req, res) => {
  try {
    const { department_id, year_id } = req.query;
    let query = `
      SELECT bs.*, d.name as department_name, d.code as department_code, y.year_name
      FROM batches_sections bs
      JOIN departments d ON bs.department_id = d.id
      JOIN years y ON bs.year_id = y.id
      WHERE 1=1
    `;
    const params = [];
    if (department_id) {
      query += ` AND bs.department_id = ?`;
      params.push(department_id);
    }
    if (year_id) {
      query += ` AND bs.year_id = ?`;
      params.push(year_id);
    }
    query += ` ORDER BY d.code, y.display_order, bs.section_name`;

    const batches = db.prepare(query).all(...params);
    return res.json({ success: true, batches });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve batches/sections.' });
  }
};

exports.createBatch = (req, res) => {
  try {
    const { department_id, year_id, section_name } = req.body;
    if (!department_id || !year_id || !section_name) {
      return res.status(400).json({ error: 'Department, year, and section name are required.' });
    }

    const exists = db.prepare('SELECT id FROM batches_sections WHERE department_id = ? AND year_id = ? AND section_name = ?').get(department_id, year_id, section_name.trim());
    if (exists) return res.status(409).json({ error: 'Section/Batch already exists for this department and year.' });

    const info = db.prepare('INSERT INTO batches_sections (department_id, year_id, section_name) VALUES (?, ?, ?)').run(department_id, year_id, section_name.trim());
    const batch = db.prepare('SELECT * FROM batches_sections WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, batch });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create section/batch.' });
  }
};

exports.updateBatch = (req, res) => {
  try {
    const { id } = req.params;
    const { section_name, status } = req.body;
    const existing = db.prepare('SELECT * FROM batches_sections WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Section not found.' });

    db.prepare('UPDATE batches_sections SET section_name = ?, status = ? WHERE id = ?').run(
      section_name ? section_name.trim() : existing.section_name,
      status || existing.status,
      id
    );

    const updated = db.prepare('SELECT * FROM batches_sections WHERE id = ?').get(id);
    return res.json({ success: true, batch: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update section.' });
  }
};

// --- SUBJECTS ---
exports.getSubjects = (req, res) => {
  try {
    const { department_id } = req.query;
    let query = `
      SELECT s.*, d.name as department_name, d.code as department_code
      FROM subjects s
      JOIN departments d ON s.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    if (department_id) {
      query += ` AND s.department_id = ?`;
      params.push(department_id);
    }
    query += ` ORDER BY d.code, s.name`;

    const subjects = db.prepare(query).all(...params);
    return res.json({ success: true, subjects });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve subjects.' });
  }
};

exports.createSubject = (req, res) => {
  try {
    const { code, name, department_id } = req.body;
    if (!code || !name || !department_id) {
      return res.status(400).json({ error: 'Subject code, name, and department are required.' });
    }

    const exists = db.prepare('SELECT id FROM subjects WHERE code = ? AND department_id = ?').get(code.trim(), department_id);
    if (exists) return res.status(409).json({ error: 'Subject code already exists for this department.' });

    const info = db.prepare('INSERT INTO subjects (code, name, department_id) VALUES (?, ?, ?)').run(code.trim(), name.trim(), department_id);
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, subject });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create subject.' });
  }
};

exports.updateSubject = (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, department_id, status } = req.body;
    const existing = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Subject not found.' });

    db.prepare(`
      UPDATE subjects
      SET code = ?, name = ?, department_id = ?, status = ?
      WHERE id = ?
    `).run(
      code ? code.trim() : existing.code,
      name ? name.trim() : existing.name,
      department_id || existing.department_id,
      status || existing.status,
      id
    );

    const updated = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id);
    return res.json({ success: true, subject: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update subject.' });
  }
};

// --- FACULTY ---
exports.getFaculty = (req, res) => {
  try {
    const { department_id } = req.query;
    let query = `
      SELECT f.*, d.name as department_name, d.code as department_code
      FROM faculty f
      JOIN departments d ON f.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    if (department_id) {
      query += ` AND f.department_id = ?`;
      params.push(department_id);
    }
    query += ` ORDER BY d.code, f.name`;

    const faculty = db.prepare(query).all(...params);
    return res.json({ success: true, faculty });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve faculty members.' });
  }
};

exports.createFaculty = (req, res) => {
  try {
    const { name, department_id, email, designation } = req.body;
    if (!name || !department_id) {
      return res.status(400).json({ error: 'Faculty name and department are required.' });
    }

    const info = db.prepare(`
      INSERT INTO faculty (name, department_id, email, designation)
      VALUES (?, ?, ?, ?)
    `).run(name.trim(), department_id, email ? email.trim() : null, designation ? designation.trim() : 'Assistant Professor');

    const created = db.prepare('SELECT * FROM faculty WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, faculty: created });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add faculty member.' });
  }
};

exports.updateFaculty = (req, res) => {
  try {
    const { id } = req.params;
    const { name, department_id, email, designation, status } = req.body;
    const existing = db.prepare('SELECT * FROM faculty WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Faculty not found.' });

    db.prepare(`
      UPDATE faculty
      SET name = ?, department_id = ?, email = ?, designation = ?, status = ?
      WHERE id = ?
    `).run(
      name ? name.trim() : existing.name,
      department_id || existing.department_id,
      email !== undefined ? (email ? email.trim() : null) : existing.email,
      designation !== undefined ? designation.trim() : existing.designation,
      status || existing.status,
      id
    );

    const updated = db.prepare('SELECT * FROM faculty WHERE id = ?').get(id);
    return res.json({ success: true, faculty: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update faculty member.' });
  }
};

// --- TIME SLOTS ---
exports.getTimeSlots = (req, res) => {
  try {
    const slots = db.prepare('SELECT * FROM time_slots ORDER BY display_order ASC').all();
    return res.json({ success: true, slots });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve time slots.' });
  }
};

exports.updateTimeSlot = (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time } = req.body;
    const existing = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Time slot not found.' });

    db.prepare('UPDATE time_slots SET start_time = ?, end_time = ? WHERE id = ?').run(
      start_time ? start_time.trim() : existing.start_time,
      end_time ? end_time.trim() : existing.end_time,
      id
    );

    const updated = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(id);
    return res.json({ success: true, slot: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update time slot.' });
  }
};
