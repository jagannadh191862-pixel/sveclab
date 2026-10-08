const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Vercel serverless functions cannot reliably use the project directory
// for runtime-created files. Use /tmp on Vercel and the normal data folder locally.
const isVercel = Boolean(process.env.VERCEL);

const dbDir = isVercel
  ? '/tmp'
  : path.join(__dirname, '..', 'data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'svec_lab_scheduler.db');

const db = new Database(dbPath, {
  // verbose: console.log
});

// Configure SQLite for high concurrency and relational integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

function initDatabase() {
  db.exec(`
    -- System Settings
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY,
      college_name TEXT NOT NULL DEFAULT 'Sri Vasavi Engineering College',
      system_title TEXT NOT NULL DEFAULT 'SVEC Lab Scheduler',
      subtitle TEXT NOT NULL DEFAULT 'Laboratory Scheduling & Booking System',
      allowed_email_domain TEXT NOT NULL DEFAULT '',
      require_email_domain INTEGER NOT NULL DEFAULT 0,
      academic_year TEXT NOT NULL DEFAULT '2026-2027',
      allow_retrospective_booking_admin INTEGER NOT NULL DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Departments
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Years
    CREATE TABLE IF NOT EXISTS years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year_name TEXT UNIQUE NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active'
    );

    -- Batches / Sections
    CREATE TABLE IF NOT EXISTS batches_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      year_id INTEGER NOT NULL REFERENCES years(id) ON DELETE CASCADE,
      section_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      UNIQUE(department_id, year_id, section_name)
    );

    -- Subjects
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'active',
      UNIQUE(code, department_id)
    );

    -- Faculty
    CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      email TEXT,
      designation TEXT DEFAULT 'Assistant Professor',
      status TEXT NOT NULL DEFAULT 'active'
    );

    -- Time Slots (P1 - P7 + BREAK, exactly 7 bookable slots, BREAK is non-bookable, NO P8)
    CREATE TABLE IF NOT EXISTS time_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT UNIQUE NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      bookable INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL UNIQUE
    );

    -- Laboratories (Loaded from Excel)
    CREATE TABLE IF NOT EXISTS labs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lab_id TEXT UNIQUE NOT NULL,
      lab_name TEXT NOT NULL,
      department TEXT NOT NULL,
      department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
      building_block TEXT NOT NULL,
      room_number TEXT DEFAULT '',
      capacity INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      remarks TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users / Profiles
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'administrator')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      is_verified INTEGER NOT NULL DEFAULT 1,
      verification_token TEXT,
      reset_token TEXT,
      reset_token_expiry DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Bookings
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
      slot_id INTEGER NOT NULL REFERENCES time_slots(id) ON DELETE RESTRICT,
      faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
      department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
      year_id INTEGER NOT NULL REFERENCES years(id) ON DELETE RESTRICT,
      batch_id INTEGER NOT NULL REFERENCES batches_sections(id) ON DELETE RESTRICT,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
      subject_code TEXT,
      expected_students INTEGER,
      remarks TEXT DEFAULT '',
      booked_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'BOOKED' CHECK(status IN ('BOOKED', 'CANCELLED')),
      cancellation_reason TEXT,
      cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      cancelled_at DATETIME,
      modified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      modified_at DATETIME,
      modification_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- CRITICAL DATABASE-LEVEL DOUBLE BOOKING PROTECTION
    -- Ensures at database engine level that no two active bookings
    -- can share the same (lab_id, date, slot_id)
    CREATE UNIQUE INDEX IF NOT EXISTS idx_active_bookings_unique
    ON bookings (lab_id, date, slot_id)
    WHERE status = 'BOOKED';

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_bookings_date
    ON bookings (date);

    CREATE INDEX IF NOT EXISTS idx_bookings_lab_date
    ON bookings (lab_id, date);

    CREATE INDEX IF NOT EXISTS idx_bookings_user
    ON bookings (booked_by);

    CREATE INDEX IF NOT EXISTS idx_bookings_status
    ON bookings (status);

    CREATE INDEX IF NOT EXISTS idx_bookings_dept
    ON bookings (department_id);

    -- Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(
        action IN (
          'CREATED',
          'MODIFIED',
          'CANCELLED',
          'DELETED',
          'ADMIN_BOOKING_CREATED'
        )
      ),
      performed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      performed_by_name TEXT NOT NULL,
      performed_by_role TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      old_value TEXT,
      new_value TEXT,
      reason TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_audit_booking_id
    ON audit_logs (booking_id);

    CREATE INDEX IF NOT EXISTS idx_audit_timestamp
    ON audit_logs (timestamp);
  `);
}

initDatabase();

module.exports = {
  db,
  initDatabase
};