const { db } = require('../db');

exports.getPublicSettings = (req, res) => {
  try {
    const settings = db.prepare(`
      SELECT college_name, system_title, subtitle, allowed_email_domain, require_email_domain, academic_year
      FROM system_settings WHERE id = 1
    `).get();

    return res.json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve public settings.' });
  }
};

exports.getAdminSettings = (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM system_settings WHERE id = 1').get();
    return res.json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve system settings.' });
  }
};

exports.updateSettings = (req, res) => {
  try {
    const {
      college_name,
      system_title,
      subtitle,
      allowed_email_domain,
      require_email_domain,
      academic_year,
      allow_retrospective_booking_admin
    } = req.body;

    const existing = db.prepare('SELECT * FROM system_settings WHERE id = 1').get();

    db.prepare(`
      UPDATE system_settings
      SET college_name = ?, system_title = ?, subtitle = ?, allowed_email_domain = ?,
          require_email_domain = ?, academic_year = ?, allow_retrospective_booking_admin = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      college_name ? college_name.trim() : existing.college_name,
      system_title ? system_title.trim() : existing.system_title,
      subtitle ? subtitle.trim() : existing.subtitle,
      allowed_email_domain !== undefined ? allowed_email_domain.trim() : existing.allowed_email_domain,
      require_email_domain !== undefined ? (require_email_domain ? 1 : 0) : existing.require_email_domain,
      academic_year ? academic_year.trim() : existing.academic_year,
      allow_retrospective_booking_admin !== undefined ? (allow_retrospective_booking_admin ? 1 : 0) : existing.allow_retrospective_booking_admin
    );

    const updated = db.prepare('SELECT * FROM system_settings WHERE id = 1').get();
    return res.json({ success: true, message: 'System settings updated successfully.', settings: updated });
  } catch (err) {
    console.error('Error updating settings:', err);
    return res.status(500).json({ error: 'Failed to update system settings.' });
  }
};
