const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

exports.register = (req, res) => {
  try {
    const { name, email, employee_id, password, department_id } = req.body;

    if (!name || !email || !employee_id || !password) {
      return res.status(400).json({ error: 'Name, email, employee ID, and password are required.' });
    }

    // Check system settings for email domain restriction
    const settings = db.prepare('SELECT allowed_email_domain, require_email_domain FROM system_settings WHERE id = 1').get();
    if (settings && settings.require_email_domain && settings.allowed_email_domain) {
      const allowed = settings.allowed_email_domain.trim().toLowerCase();
      if (!email.toLowerCase().endsWith(allowed)) {
        return res.status(400).json({
          error: `Registration restricted to college domain (${allowed}). Please use your official institutional email.`
        });
      }
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id, email, employee_id FROM users WHERE email = ? OR employee_id = ?').get(email.toLowerCase(), employee_id);
    if (existing) {
      if (existing.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }
      return res.status(409).json({ error: 'An account with this Employee ID already exists.' });
    }

    // Generate unique user ID
    const countRow = db.prepare('SELECT COUNT(*) as c FROM users').get();
    const nextSeq = countRow.c + 1;
    const userId = `USR-${String(nextSeq).padStart(4, '0')}`;

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const verificationToken = crypto.randomBytes(24).toString('hex');

    db.prepare(`
      INSERT INTO users (user_id, employee_id, name, email, password_hash, department_id, role, status, is_verified, verification_token)
      VALUES (?, ?, ?, ?, ?, ?, 'user', 'active', 0, ?)
    `).run(
      userId,
      employee_id,
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      department_id || null,
      verificationToken
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully. Please verify your email to activate all booking features.',
      verificationToken // returned for easy test/demo verification link
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred during registration.' });
  }
};

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare(`
      SELECT u.id, u.user_id, u.employee_id, u.name, u.email, u.password_hash, u.role, u.status, u.is_verified, u.department_id,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE LOWER(u.email) = LOWER(?)
    `).get(email.trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account is currently inactive. Please contact the administrator.' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, user_id: user.user_id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const safeUser = {
      id: user.id,
      userId: user.user_id,
      employeeId: user.employee_id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isVerified: Boolean(user.is_verified),
      departmentId: user.department_id,
      departmentName: user.department_name,
      departmentCode: user.department_code
    };

    return res.json({
      success: true,
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred during login.' });
  }
};

exports.verifyEmail = (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    const user = db.prepare('SELECT id, name, email FROM users WHERE verification_token = ?').get(token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }

    db.prepare('UPDATE users SET is_verified = 1, verification_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    return res.json({
      success: true,
      message: 'Email verified successfully. You may now log in.'
    });
  } catch (err) {
    console.error('Email verify error:', err);
    return res.status(500).json({ error: 'Failed to verify email.' });
  }
};

exports.forgotPassword = (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = db.prepare('SELECT id, email, name FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (!user) {
      // Security standard: don't reveal if account exists
      return res.json({
        success: true,
        message: 'If an account exists with that email, password reset instructions have been generated.'
      });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?').run(resetToken, expiry, user.id);

    return res.json({
      success: true,
      message: 'Password reset link generated successfully.',
      resetToken // Provided so user can test the reset workflow easily
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Failed to process forgot password request.' });
  }
};

exports.resetPassword = (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    const user = db.prepare(`
      SELECT id, reset_token_expiry FROM users WHERE reset_token = ?
    `).get(token);

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    if (new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({ error: 'Password reset token has expired. Please request a new one.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);

    db.prepare(`
      UPDATE users 
      SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(hash, user.id);

    return res.json({
      success: true,
      message: 'Your password has been successfully reset. Please log in with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
};

exports.getProfile = (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
};

exports.updateProfile = (req, res) => {
  try {
    const { name, department_id } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    db.prepare(`
      UPDATE users 
      SET name = ?, department_id = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(name.trim(), department_id || null, req.user.id);

    const updatedUser = db.prepare(`
      SELECT u.id, u.user_id, u.employee_id, u.name, u.email, u.role, u.status, u.is_verified, u.department_id,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `).get(req.user.id);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
};

exports.changePassword = (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, req.user.id);

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
};
