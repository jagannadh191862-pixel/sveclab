const { db } = require('../db');

function parseSlotTimeToMinutes(timeStr) {
  // e.g. "9:30 AM" or "1:00 PM"
  const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return 0;
  let [_, h, m, meridiem] = match;
  let hours = parseInt(h, 10);
  const minutes = parseInt(m, 10);
  if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

exports.getScheduleMatrix = (req, res) => {
  try {
    const { date, department, lab_id, search } = req.query;
    
    // Default to today if date not passed
    const queryDate = date || new Date().toISOString().split('T')[0];

    // 1. Fetch all time slots in display order
    const timeSlots = db.prepare('SELECT * FROM time_slots ORDER BY display_order ASC').all();

    // 2. Fetch laboratories
    let labQuery = `
      SELECT l.*, d.name as department_name, d.code as department_code
      FROM labs l
      LEFT JOIN departments d ON l.department_id = d.id
      WHERE l.status = 'active'
    `;
    const labParams = [];

    if (department && department !== 'ALL') {
      labQuery += ` AND (l.department = ? OR l.department_id = ?)`;
      labParams.push(department, department);
    }

    if (lab_id) {
      labQuery += ` AND l.id = ?`;
      labParams.push(lab_id);
    }

    if (search) {
      labQuery += ` AND (l.lab_name LIKE ? OR l.building_block LIKE ?)`;
      const term = `%${search}%`;
      labParams.push(term, term);
    }

    labQuery += ` ORDER BY l.id ASC`;
    const labs = db.prepare(labQuery).all(...labParams);

    // 3. Fetch active bookings for this date
    const bookings = db.prepare(`
      SELECT b.id, b.booking_id, b.date, b.lab_id, b.slot_id, b.status, b.booked_by,
             b.remarks, b.expected_students,
             f.name as faculty_name,
             d.code as department_code, d.name as department_name,
             y.year_name,
             bs.section_name,
             sub.name as subject_name, sub.code as subject_code,
             u.name as booked_by_name, u.email as booked_by_email
      FROM bookings b
      JOIN faculty f ON b.faculty_id = f.id
      JOIN departments d ON b.department_id = d.id
      JOIN years y ON b.year_id = y.id
      JOIN batches_sections bs ON b.batch_id = bs.id
      JOIN subjects sub ON b.subject_id = sub.id
      JOIN users u ON b.booked_by = u.id
      WHERE b.date = ? AND b.status = 'BOOKED'
    `).all(queryDate);

    // Create a fast lookup map: key = `${lab_id}_${slot_id}`
    const bookingMap = {};
    for (const b of bookings) {
      bookingMap[`${b.lab_id}_${b.slot_id}`] = {
        ...b,
        isOwnBooking: req.user ? b.booked_by === req.user.id : false
      };
    }

    // Determine current local time for past slot checking
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isPastDate = queryDate < todayStr;
    const isToday = queryDate === todayStr;

    // Build the grid matrix: for each lab, for each slot
    const grid = labs.map(lab => {
      const slots = timeSlots.map(slot => {
        const booking = bookingMap[`${lab.id}_${slot.id}`] || null;
        let isPastSlot = false;
        if (isPastDate) {
          isPastSlot = true;
        } else if (isToday) {
          const slotStartMinutes = parseSlotTimeToMinutes(slot.start_time);
          if (slotStartMinutes <= currentMinutes) {
            isPastSlot = true;
          }
        }

        let slotStatus = 'AVAILABLE';
        if (!slot.bookable) {
          slotStatus = 'BREAK';
        } else if (booking) {
          slotStatus = 'BOOKED';
        } else if (isPastSlot) {
          slotStatus = 'PAST';
        }

        return {
          slotId: slot.id,
          period: slot.period,
          startTime: slot.start_time,
          endTime: slot.end_time,
          bookable: Boolean(slot.bookable),
          displayOrder: slot.display_order,
          status: slotStatus,
          isPastSlot,
          booking
        };
      });

      return {
        lab,
        slots
      };
    });

    // Summary statistics for the date
    const bookableSlotsPerLab = timeSlots.filter(s => s.bookable).length; // 7
    const totalPossibleSlots = labs.length * bookableSlotsPerLab;
    const bookedCount = bookings.filter(b => labs.some(l => l.id === b.lab_id)).length;
    const availableCount = Math.max(0, totalPossibleSlots - bookedCount);
    const utilizationPct = totalPossibleSlots > 0 ? Math.round((bookedCount / totalPossibleSlots) * 100) : 0;

    return res.json({
      success: true,
      date: queryDate,
      isToday,
      isPastDate,
      timeSlots,
      labs,
      grid,
      stats: {
        totalLabs: labs.length,
        totalBookableSlots: totalPossibleSlots,
        bookedSlots: bookedCount,
        availableSlots: availableCount,
        utilizationPercentage: utilizationPct
      }
    });
  } catch (err) {
    console.error('Error generating schedule matrix:', err);
    return res.status(500).json({ error: 'Failed to retrieve schedule grid.' });
  }
};
