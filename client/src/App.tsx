import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { AppShell } from './components/layout/AppShell';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';

// User Pages
import { UserDashboard } from './pages/user/UserDashboard';
import { LabSchedule } from './pages/user/LabSchedule';
import { BookLab } from './pages/user/BookLab';
import { BookingConfirmation } from './pages/user/BookingConfirmation';
import { MyBookings } from './pages/user/MyBookings';
import { Profile } from './pages/user/Profile';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSchedule } from './pages/admin/AdminSchedule';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminLabs } from './pages/admin/AdminLabs';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminDepartments } from './pages/admin/AdminDepartments';
import { AdminYears } from './pages/admin/AdminYears';
import { AdminBatches } from './pages/admin/AdminBatches';
import { AdminSubjects } from './pages/admin/AdminSubjects';
import { AdminFaculty } from './pages/admin/AdminFaculty';
import { AdminTimeSlots } from './pages/admin/AdminTimeSlots';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminSettings } from './pages/admin/AdminSettings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicOnlyRoute>
                  <Signup />
                </PublicOnlyRoute>
              }
            />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected User Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/lab-schedule" element={<LabSchedule />} />
              <Route path="/book-lab" element={<BookLab />} />
              <Route path="/booking-confirmation" element={<BookingConfirmation />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AppShell />
                </AdminRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="schedule" element={<AdminSchedule />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="labs" element={<AdminLabs />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="departments" element={<AdminDepartments />} />
              <Route path="years" element={<AdminYears />} />
              <Route path="batches" element={<AdminBatches />} />
              <Route path="subjects" element={<AdminSubjects />} />
              <Route path="faculty" element={<AdminFaculty />} />
              <Route path="time-slots" element={<AdminTimeSlots />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Root & Catch-all Fallback */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
