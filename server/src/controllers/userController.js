const { db } = require('../db');

exports.getAllUsers = (req, res) => {
  try {
    const { role, status, department_id, search, page = 1, limit = 25 } = req.query;

    let query = `
      SELECT u.id, u.user_id, u.employee_id, u.name, u.email, u.role, u.status, u.is_verified,
             u.department_id, u.created_at,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== 'ALL') {
      query += ` AND u.role = ?`;
      params.push(role);
    }
    if (status && status !== 'ALL') {
      query += ` AND u.status = ?`;
      params.push(status);
    }
    if (department_id && department_id !== 'ALL') {
      query += ` AND u.department_id = ?`;
      params.push(department_id);
    }
    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.employee_id LIKE ? OR u.user_id LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const countSql = `SELECT COUNT(*) as total FROM (${query})`;
    const totalRow = db.prepare(countSql).get(...params);
    const total = totalRow ? totalRow.total : 0;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const offset = (pageNum - 1) * limitNum;

    query += ` ORDER BY u.id ASC LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const users = db.prepare(query).all(...params);

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
};

exports.updateUserStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active or inactive.' });
    }

    if (parseInt(id, 10) === req.user.id && status === 'inactive') {
      return res.status(400).json({ error: 'You cannot deactivate your own administrator account.' });
    }

    db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

    return res.json({ success: true, message: `User status changed to ${status}.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
};

exports.updateUserRole = (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'administrator'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be user or administrator.' });
    }

    if (parseInt(id, 10) === req.user.id && role !== 'administrator') {
      return res.status(400).json({ error: 'You cannot revoke your own administrator privileges.' });
    }

    db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(role, id);

    return res.json({ success: true, message: `User role changed to ${role}.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
};
