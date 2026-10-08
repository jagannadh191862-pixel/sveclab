const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { db } = require('./db');
const { authenticateToken, requireAdmin } = require('./middleware/auth');

const authController = require('./controllers/authController');
const labController = require('./controllers/labController');
const scheduleController = require('./controllers/scheduleController');
const bookingController = require('./controllers/bookingController');
const masterController = require('./controllers/masterController');
const reportsController = require('./controllers/reportsController');
const auditController = require('./controllers/auditController');
const userController = require('./controllers/userController');
const settingsController = require('./controllers/settingsController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Public Settings & Info
app.get('/api/settings/public', settingsController.getPublicSettings);

// Authentication Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/verify-email', authController.verifyEmail);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password', authController.resetPassword);

// Authenticated User Routes
app.get('/api/auth/me', authenticateToken, authController.getProfile);
app.put('/api/auth/profile', authenticateToken, authController.updateProfile);
app.put('/api/auth/change-password', authenticateToken, authController.changePassword);

// Schedule Matrix (Primary Operational View)
app.get('/api/schedule', authenticateToken, scheduleController.getScheduleMatrix);

// Laboratories
app.get('/api/labs', authenticateToken, labController.getAllLabs);
app.get('/api/labs/:id', authenticateToken, labController.getLabById);
app.post('/api/labs', authenticateToken, requireAdmin, labController.createLab);
app.put('/api/labs/:id', authenticateToken, requireAdmin, labController.updateLab);
app.patch('/api/labs/:id/toggle', authenticateToken, requireAdmin, labController.toggleLabStatus);

// Bookings
app.post('/api/bookings', authenticateToken, bookingController.createBooking);
app.get('/api/bookings/my', authenticateToken, bookingController.getMyBookings);
app.get('/api/bookings/all', authenticateToken, requireAdmin, bookingController.getAllBookings);
app.post('/api/bookings/:id/cancel', authenticateToken, bookingController.cancelBooking);
app.put('/api/bookings/:id/admin-update', authenticateToken, requireAdmin, bookingController.adminUpdateBooking);
app.delete('/api/bookings/:id/admin-delete', authenticateToken, requireAdmin, bookingController.adminDeleteBooking);

// Master Data
app.get('/api/master/departments', authenticateToken, masterController.getDepartments);
app.post('/api/master/departments', authenticateToken, requireAdmin, masterController.createDepartment);
app.put('/api/master/departments/:id', authenticateToken, requireAdmin, masterController.updateDepartment);

app.get('/api/master/years', authenticateToken, masterController.getYears);
app.post('/api/master/years', authenticateToken, requireAdmin, masterController.createYear);
app.put('/api/master/years/:id', authenticateToken, requireAdmin, masterController.updateYear);

app.get('/api/master/batches', authenticateToken, masterController.getBatches);
app.post('/api/master/batches', authenticateToken, requireAdmin, masterController.createBatch);
app.put('/api/master/batches/:id', authenticateToken, requireAdmin, masterController.updateBatch);

app.get('/api/master/subjects', authenticateToken, masterController.getSubjects);
app.post('/api/master/subjects', authenticateToken, requireAdmin, masterController.createSubject);
app.put('/api/master/subjects/:id', authenticateToken, requireAdmin, masterController.updateSubject);

app.get('/api/master/faculty', authenticateToken, masterController.getFaculty);
app.post('/api/master/faculty', authenticateToken, requireAdmin, masterController.createFaculty);
app.put('/api/master/faculty/:id', authenticateToken, requireAdmin, masterController.updateFaculty);

app.get('/api/master/time-slots', authenticateToken, masterController.getTimeSlots);
app.put('/api/master/time-slots/:id', authenticateToken, requireAdmin, masterController.updateTimeSlot);

// Reports
app.get('/api/reports/daily-schedule', authenticateToken, requireAdmin, reportsController.getDailyScheduleReport);
app.get('/api/reports/date-range', authenticateToken, requireAdmin, reportsController.getDateRangeReport);
app.get('/api/reports/lab-utilization', authenticateToken, requireAdmin, reportsController.getLabUtilizationReport);
app.get('/api/reports/faculty-usage', authenticateToken, requireAdmin, reportsController.getFacultyUsageReport);
app.get('/api/reports/department-usage', authenticateToken, requireAdmin, reportsController.getDepartmentUsageReport);
app.get('/api/reports/cancelled', authenticateToken, requireAdmin, reportsController.getCancelledBookingsReport);
app.get('/api/reports/export', authenticateToken, requireAdmin, reportsController.exportReport);

// Audit Logs
app.get('/api/audit-logs', authenticateToken, requireAdmin, auditController.getAuditLogs);

// User Management
app.get('/api/users', authenticateToken, requireAdmin, userController.getAllUsers);
app.patch('/api/users/:id/status', authenticateToken, requireAdmin, userController.updateUserStatus);
app.patch('/api/users/:id/role', authenticateToken, requireAdmin, userController.updateUserRole);

// System Settings
app.get('/api/settings', authenticateToken, requireAdmin, settingsController.getAdminSettings);
app.put('/api/settings', authenticateToken, requireAdmin, settingsController.updateSettings);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend build if dist exists
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send('Not Found');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({ error: 'Internal Server Error.' });
});

app.listen(PORT, () => {
  console.log(`SVEC Lab Scheduler Backend running on http://localhost:${PORT}`);
});

module.exports = app;
