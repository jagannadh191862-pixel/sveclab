const { db } = require('../db');

exports.getAuditLogs = (req, res) => {
  try {
    const { booking_id, action, search, page = 1, limit = 25 } = req.query;

    let query = `
      SELECT a.*, u.email as performed_by_email
      FROM audit_logs a
      LEFT JOIN users u ON a.performed_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (booking_id) {
      query += ` AND a.booking_id = ?`;
      params.push(booking_id);
    }
    if (action && action !== 'ALL') {
      query += ` AND a.action = ?`;
      params.push(action);
    }
    if (search) {
      query += ` AND (a.booking_id LIKE ? OR a.performed_by_name LIKE ? OR a.reason LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const countSql = `SELECT COUNT(*) as total FROM (${query})`;
    const totalRow = db.prepare(countSql).get(...params);
    const total = totalRow ? totalRow.total : 0;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const offset = (pageNum - 1) * limitNum;

    query += ` ORDER BY a.id DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const logs = db.prepare(query).all(...params);

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      logs
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return res.status(500).json({ error: 'Failed to retrieve audit trail.' });
  }
};
