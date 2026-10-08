const { db } = require('./db');
const bcrypt = require('bcryptjs');

const EXCEL_LABS = [
  { sNo: 1, dept: 'PLACEMENT BLOCK', name: 'Y-LAB', capacity: 72, block: 'Placement Block', room: 'PB-101' },
  { sNo: 2, dept: 'PLACEMENT BLOCK', name: 'P-LAB', capacity: 72, block: 'Placement Block', room: 'PB-102' },
  { sNo: 3, dept: 'PLACEMENT BLOCK', name: 'O-LAB', capacity: 72, block: 'Placement Block', room: 'PB-201' },
  { sNo: 4, dept: 'PLACEMENT BLOCK', name: 'G-LAB', capacity: 72, block: 'Placement Block', room: 'PB-202' },
  { sNo: 5, dept: 'PLACEMENT BLOCK', name: 'B-LAB', capacity: 72, block: 'Placement Block', room: 'PB-301' },
  { sNo: 6, dept: 'CSE', name: 'JAMES GOSLING LAB', capacity: 72, block: 'Visvesvaraya Block', room: 'VB-201' },
  { sNo: 7, dept: 'CSE', name: 'EF CODD LAB', capacity: 72, block: 'Visvesvaraya Block', room: 'VB-202' },
  { sNo: 8, dept: 'CSE', name: 'PG-CP LAB', capacity: 72, block: 'Visvesvaraya Block', room: 'VB-301' },
  { sNo: 9, dept: 'CSE', name: 'ORAGNE-SEMINAR HALL', capacity: 144, block: 'Visvesvaraya Block', room: 'VB-401' },
  { sNo: 10, dept: 'CSE', name: 'YELLOW SEMINAR HALL', capacity: 144, block: 'Visvesvaraya Block', room: 'VB-402' },
  { sNo: 11, dept: 'AIML', name: 'COMPUTER LAB', capacity: 75, block: 'Turing Block', room: 'TB-101' },
  { sNo: 12, dept: 'AIML', name: 'LINUS TURVALDS LAB', capacity: 72, block: 'Turing Block', room: 'TB-102' },
  { sNo: 13, dept: 'AIML', name: 'SEMINAR HALL -1', capacity: 144, block: 'Turing Block', room: 'TB-201' },
  { sNo: 14, dept: 'AIML', name: 'SEMINAR HALL -2', capacity: 144, block: 'Turing Block', room: 'TB-202' },
  { sNo: 15, dept: 'ECE', name: 'ECAD LAB', capacity: 72, block: 'Ramanujan Block', room: 'RB-101' },
  { sNo: 16, dept: 'ECE', name: 'SIGNAL PROCESSING LAB', capacity: 70, block: 'Ramanujan Block', room: 'RB-102' },
  { sNo: 17, dept: 'ECE', name: 'R & d LAB', capacity: 35, block: 'Ramanujan Block', room: 'RB-201' },
  { sNo: 18, dept: 'ECE', name: 'JAGADISH CHANDRAA BOSE SEMINAR HALL', capacity: 140, block: 'Ramanujan Block', room: 'RB-301' },
  { sNo: 19, dept: 'MECH', name: 'CAD/CAM LAB', capacity: 72, block: 'Mechanical Block', room: 'MB-101' },
  { sNo: 20, dept: 'MECH', name: 'SEMINAR HALL-1', capacity: 140, block: 'Mechanical Block', room: 'MB-201' },
  { sNo: 21, dept: 'MECH', name: 'SEMINAR HALL-2', capacity: 140, block: 'Mechanical Block', room: 'MB-202' },
  { sNo: 22, dept: 'EEE', name: 'SIMULATION LAB', capacity: 76, block: 'Faraday Block', room: 'FB-101' },
  { sNo: 23, dept: 'POLYTECHNIC', name: 'COMPUTER LAB 1', capacity: 66, block: 'Polytechnic Block', room: 'PB-001' },
  { sNo: 24, dept: 'POLYTECHNIC', name: 'COMPUTER LAB 2', capacity: 66, block: 'Polytechnic Block', room: 'PB-002' },
  { sNo: 25, dept: 'POLYTECHNIC', name: 'CHANAKYA CONCLAVE HALL', capacity: 110, block: 'Polytechnic Block', room: 'PB-101' },
  { sNo: 26, dept: 'BSH', name: 'TECHNOLOGY ASSISTANT LAB', capacity: 40, block: 'Basic Sciences Block', room: 'BS-101' },
  { sNo: 27, dept: 'BSH', name: 'APJ ABDUL KALAM SEMINAR HALL', capacity: 140, block: 'Basic Sciences Block', room: 'BS-201' },
  { sNo: 28, dept: 'BSH', name: 'MAHATHMA GANDHI SEMINAR HALL', capacity: 60, block: 'Basic Sciences Block', room: 'BS-202' },
  { sNo: 29, dept: 'MBA', name: 'SEMINAR HALL', capacity: 120, block: 'Management Block', room: 'MN-101' },
];

const DEPARTMENTS = [
  { code: 'PLACEMENT BLOCK', name: 'Placement & Training Division' },
  { code: 'CSE', name: 'Computer Science & Engineering' },
  { code: 'AIML', name: 'Artificial Intelligence & Machine Learning' },
  { code: 'ECE', name: 'Electronics & Communication Engineering' },
  { code: 'MECH', name: 'Mechanical Engineering' },
  { code: 'EEE', name: 'Electrical & Electronics Engineering' },
  { code: 'POLYTECHNIC', name: 'Polytechnic / Diploma Division' },
  { code: 'BSH', name: 'Basic Sciences & Humanities' },
  { code: 'MBA', name: 'Management Studies' },
];

const TIME_SLOTS = [
  { period: 'P1', start_time: '9:30 AM', end_time: '10:30 AM', bookable: 1, display_order: 1 },
  { period: 'P2', start_time: '10:30 AM', end_time: '11:20 AM', bookable: 1, display_order: 2 },
  { period: 'P3', start_time: '11:20 AM', end_time: '12:10 PM', bookable: 1, display_order: 3 },
  { period: 'P4', start_time: '12:10 PM', end_time: '1:00 PM', bookable: 1, display_order: 4 },
  { period: 'BREAK', start_time: '1:00 PM', end_time: '2:00 PM', bookable: 0, display_order: 5 },
  { period: 'P5', start_time: '2:00 PM', end_time: '2:50 PM', bookable: 1, display_order: 6 },
  { period: 'P6', start_time: '2:50 PM', end_time: '3:40 PM', bookable: 1, display_order: 7 },
  { period: 'P7', start_time: '3:40 PM', end_time: '4:30 PM', bookable: 1, display_order: 8 },
];

const YEARS = [
  { year_name: 'I B.Tech', display_order: 1 },
  { year_name: 'II B.Tech', display_order: 2 },
  { year_name: 'III B.Tech', display_order: 3 },
  { year_name: 'IV B.Tech', display_order: 4 },
  { year_name: 'I Diploma', display_order: 5 },
  { year_name: 'II Diploma', display_order: 6 },
  { year_name: 'III Diploma', display_order: 7 },
  { year_name: 'I MBA', display_order: 8 },
  { year_name: 'II MBA', display_order: 9 },
];

function seed() {
  const insertMany = db.transaction(() => {
    // 1. System Settings
    const existingSettings = db.prepare('SELECT id FROM system_settings LIMIT 1').get();
    if (!existingSettings) {
      db.prepare(`
        INSERT INTO system_settings (id, college_name, system_title, subtitle, allowed_email_domain, require_email_domain, academic_year, allow_retrospective_booking_admin)
        VALUES (1, 'Sri Vasavi Engineering College', 'SVEC Lab Scheduler', 'Laboratory Scheduling & Booking System', '', 0, '2026-2027', 1)
      `).run();
    }

    // 2. Departments
    const deptMap = {};
    for (const d of DEPARTMENTS) {
      let deptRow = db.prepare('SELECT id, code FROM departments WHERE code = ?').get(d.code);
      if (!deptRow) {
        const info = db.prepare('INSERT INTO departments (code, name) VALUES (?, ?)').run(d.code, d.name);
        deptMap[d.code] = info.lastInsertRowid;
      } else {
        deptMap[d.code] = deptRow.id;
      }
    }

    // 3. Years
    const yearMap = {};
    for (const y of YEARS) {
      let yRow = db.prepare('SELECT id, year_name FROM years WHERE year_name = ?').get(y.year_name);
      if (!yRow) {
        const info = db.prepare('INSERT INTO years (year_name, display_order) VALUES (?, ?)').run(y.year_name, y.display_order);
        yearMap[y.year_name] = info.lastInsertRowid;
      } else {
        yearMap[y.year_name] = yRow.id;
      }
    }

    // 4. Time Slots
    for (const slot of TIME_SLOTS) {
      const existingSlot = db.prepare('SELECT id FROM time_slots WHERE period = ?').get(slot.period);
      if (!existingSlot) {
        db.prepare(`
          INSERT INTO time_slots (period, start_time, end_time, bookable, display_order)
          VALUES (?, ?, ?, ?, ?)
        `).run(slot.period, slot.start_time, slot.end_time, slot.bookable, slot.display_order);
      }
    }

    // 5. Batches / Sections
    const sectionNames = ['Section A', 'Section B', 'Section C'];
    for (const [code, deptId] of Object.entries(deptMap)) {
      for (const [yName, yId] of Object.entries(yearMap)) {
        // Only associate relevant years
        const isDiplomaDept = code === 'POLYTECHNIC';
        const isDiplomaYear = yName.includes('Diploma');
        const isMbaDept = code === 'MBA';
        const isMbaYear = yName.includes('MBA');
        const isBTechYear = yName.includes('B.Tech');

        if ((isDiplomaDept && isDiplomaYear) || (isMbaDept && isMbaYear) || (!isDiplomaDept && !isMbaDept && isBTechYear)) {
          for (const sName of sectionNames) {
            const exists = db.prepare('SELECT id FROM batches_sections WHERE department_id = ? AND year_id = ? AND section_name = ?').get(deptId, yId, sName);
            if (!exists) {
              db.prepare('INSERT INTO batches_sections (department_id, year_id, section_name) VALUES (?, ?, ?)').run(deptId, yId, sName);
            }
          }
        }
      }
    }

    // 6. Subjects for Departments
    const subjectData = [
      { dept: 'CSE', code: '23CS301L', name: 'Database Management Systems Lab' },
      { dept: 'CSE', code: '23CS302L', name: 'Operating Systems Lab' },
      { dept: 'CSE', code: '23CS401L', name: 'Web Technologies Lab' },
      { dept: 'CSE', code: '23CS402L', name: 'Compiler Design Lab' },
      { dept: 'AIML', code: '23AI301L', name: 'Artificial Intelligence Lab' },
      { dept: 'AIML', code: '23AI302L', name: 'Machine Learning Lab' },
      { dept: 'AIML', code: '23AI401L', name: 'Deep Learning & NLP Lab' },
      { dept: 'ECE', code: '23EC301L', name: 'Analog & Digital Circuits Lab' },
      { dept: 'ECE', code: '23EC302L', name: 'VLSI Design & ECAD Lab' },
      { dept: 'ECE', code: '23EC401L', name: 'Digital Signal Processing Lab' },
      { dept: 'MECH', code: '23ME301L', name: 'Computer Aided Drafting (CAD) Lab' },
      { dept: 'MECH', code: '23ME302L', name: 'CAM & CNC Simulation Lab' },
      { dept: 'EEE', code: '23EE301L', name: 'Power Systems Simulation Lab' },
      { dept: 'EEE', code: '23EE302L', name: 'Electrical Machines & Control Lab' },
      { dept: 'POLYTECHNIC', code: 'DIP-CS101', name: 'Computer Programming Practice Lab' },
      { dept: 'POLYTECHNIC', code: 'DIP-CS102', name: 'Web Design Fundamentals Lab' },
      { dept: 'BSH', code: '23BS101L', name: 'Engineering Physics & Chemistry Lab' },
      { dept: 'BSH', code: '23BS102L', name: 'English Communication Skills Lab' },
      { dept: 'MBA', code: '23MB101L', name: 'Business Analytics & Excel Lab' },
      { dept: 'PLACEMENT BLOCK', code: 'CRT-P101', name: 'Campus Recruitment Training (CRT)' },
      { dept: 'PLACEMENT BLOCK', code: 'COD-P102', name: 'Competitive Coding & Hackathon' },
    ];

    for (const sub of subjectData) {
      const deptId = deptMap[sub.dept];
      if (deptId) {
        const exists = db.prepare('SELECT id FROM subjects WHERE code = ? AND department_id = ?').get(sub.code, deptId);
        if (!exists) {
          db.prepare('INSERT INTO subjects (code, name, department_id) VALUES (?, ?, ?)').run(sub.code, sub.name, deptId);
        }
      }
    }

    // 7. Faculty
    const facultyData = [
      { dept: 'CSE', name: 'Dr. K. Srinivas', email: 'srinivas.k@svec.ac.in', designation: 'Professor & HOD' },
      { dept: 'CSE', name: 'Dr. Ravi Kumar', email: 'ravi.kumar@svec.ac.in', designation: 'Associate Professor' },
      { dept: 'CSE', name: 'Mrs. M. Sirisha', email: 'sirisha.m@svec.ac.in', designation: 'Assistant Professor' },
      { dept: 'AIML', name: 'Dr. V. Anitha', email: 'anitha.v@svec.ac.in', designation: 'Associate Professor' },
      { dept: 'AIML', name: 'Mr. B. Rajesh', email: 'rajesh.b@svec.ac.in', designation: 'Assistant Professor' },
      { dept: 'ECE', name: 'Dr. P. Suresh', email: 'suresh.p@svec.ac.in', designation: 'Professor' },
      { dept: 'ECE', name: 'Mrs. T. Lakshmi', email: 'lakshmi.t@svec.ac.in', designation: 'Assistant Professor' },
      { dept: 'MECH', name: 'Dr. Ch. Rambabu', email: 'rambabu.ch@svec.ac.in', designation: 'Professor' },
      { dept: 'EEE', name: 'Dr. N. Srikanth', email: 'srikanth.n@svec.ac.in', designation: 'Associate Professor' },
      { dept: 'POLYTECHNIC', name: 'Mr. G. Venkat Rao', email: 'venkat.g@svec.ac.in', designation: 'Senior Lecturer' },
      { dept: 'BSH', name: 'Dr. D. Rama Krishna', email: 'ramakrishna.d@svec.ac.in', designation: 'Associate Professor' },
      { dept: 'MBA', name: 'Dr. S. K. Murthy', email: 'murthy.sk@svec.ac.in', designation: 'Professor' },
      { dept: 'PLACEMENT BLOCK', name: 'Mr. K. V. Mohan', email: 'mohan.kv@svec.ac.in', designation: 'Head - Training & Placements' },
    ];

    for (const fac of facultyData) {
      const deptId = deptMap[fac.dept];
      if (deptId) {
        const exists = db.prepare('SELECT id FROM faculty WHERE name = ? AND department_id = ?').get(fac.name, deptId);
        if (!exists) {
          db.prepare('INSERT INTO faculty (name, department_id, email, designation) VALUES (?, ?, ?, ?)').run(fac.name, deptId, fac.email, fac.designation);
        }
      }
    }

    // 8. 29 LABORATORIES FROM EXCEL
    for (const lab of EXCEL_LABS) {
      const deptId = deptMap[lab.dept] || null;
      const labCode = `LAB-${String(lab.sNo).padStart(3, '0')}`;
      const existing = db.prepare('SELECT id FROM labs WHERE lab_name = ? AND department = ?').get(lab.name, lab.dept);
      if (!existing) {
        db.prepare(`
          INSERT INTO labs (lab_id, lab_name, department, department_id, building_block, room_number, capacity, status, remarks)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
        `).run(
          labCode,
          lab.name,
          lab.dept,
          deptId,
          lab.block,
          lab.room,
          lab.capacity,
          `Official Laboratory of ${lab.dept}`
        );
      }
    }

    // 9. Initial Users
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('Admin@SVEC2026', salt);
    const facultyHash = bcrypt.hashSync('Faculty@SVEC2026', salt);

    // Administrator
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@svec.ac.in');
    if (!existingAdmin) {
      db.prepare(`
        INSERT INTO users (user_id, employee_id, name, email, password_hash, department_id, role, status, is_verified)
        VALUES ('USR-0001', 'SVEC-ADM-001', 'System Administrator', 'admin@svec.ac.in', ?, ?, 'administrator', 'active', 1)
      `).run(adminHash, deptMap['CSE']);
    }

    // Normal User / Faculty 1
    const existingFac = db.prepare('SELECT id FROM users WHERE email = ?').get('faculty@svec.ac.in');
    if (!existingFac) {
      db.prepare(`
        INSERT INTO users (user_id, employee_id, name, email, password_hash, department_id, role, status, is_verified)
        VALUES ('USR-0002', 'SVEC-FAC-001', 'Dr. K. Srinivas', 'faculty@svec.ac.in', ?, ?, 'user', 'active', 1)
      `).run(facultyHash, deptMap['CSE']);
    }

    // Normal User / Faculty 2
    const existingFac2 = db.prepare('SELECT id FROM users WHERE email = ?').get('anitha.v@svec.ac.in');
    if (!existingFac2) {
      db.prepare(`
        INSERT INTO users (user_id, employee_id, name, email, password_hash, department_id, role, status, is_verified)
        VALUES ('USR-0003', 'SVEC-FAC-002', 'Dr. V. Anitha', 'anitha.v@svec.ac.in', ?, ?, 'user', 'active', 1)
      `).run(facultyHash, deptMap['AIML']);
    }
  });

  insertMany();
  console.log('Database seeded successfully with all 29 laboratories from Excel and initial master data!');
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
