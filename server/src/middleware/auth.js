const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'svec_super_secure_jwt_secret_2026_antigravity_token';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
    }

    const user = db.prepare(`
      SELECT u.id, u.user_id, u.employee_id, u.name, u.email, u.role, u.status, u.is_verified, u.department_id,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact the administrator.' });
    }

    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Unauthorized: Administrator privileges required.' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  JWT_SECRET
};
