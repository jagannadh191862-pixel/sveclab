import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Booking, ScheduleResponse } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { useToast } from '../../components/common/Toast';
import {
  CalendarDays,
  BookmarkCheck,
  Building,
  PlusCircle,
  Clock,
  ArrowRight,
  Sparkles,
  XCircle,
  Eye,
  CheckCircle2
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [schedRes, bookingsRes] = await Promise.all([
        api.getSchedule({ date: todayStr }),
        api.getMyBookings({ status: 'ALL' }),
      ]);

      if (schedRes.success) {
        setScheduleData(schedRes);
      }
      if (bookingsRes.success) {
        setMyBookings(bookingsRes.bookings || []);
      }
    } catch (err: any) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;
    try {
      setIsCancelling(true);
      const res = await api.cancelBooking(selectedBookingForCancel.id, cancelReason);
      if (res.success) {
        toast.success(res.message);
        setSelectedBookingForCancel(null);
        setCancelReason('');
        loadDashboardData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  const activeMyBookings = myBookings.filter(b => b.status === 'BOOKED');
  const upcomingBookings = activeMyBookings.filter(b => b.date >= todayStr).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sri Vasavi Engineering College • Autonomous</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Department of {user?.departmentName || 'Engineering'} • Employee ID: <span className="font-mono">{user?.employeeId}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/book-lab')}
              className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Book Laboratory</span>
            </button>
            <button
              onClick={() => navigate('/lab-schedule')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-xs sm:text-sm flex items-center gap-2 border border-white/15 transition cursor-pointer"
            >
              <CalendarDays className="w-4 h-4" />
              <span>View Full Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <LoadingSkeleton rows={1} height="h-28" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="My Active Bookings"
            value={activeMyBookings.length}
            subtitle="Reserved sessions"
            icon={BookmarkCheck}
            color="blue"
          />
          <StatCard
            title="Today's Available Slots"
            value={scheduleData?.stats.availableSlots ?? 0}
            subtitle={`Out of ${scheduleData?.stats.totalBookableSlots ?? 0} slots`}
            icon={CalendarDays}
            color="emerald"
          />
          <StatCard
            title="Today's Booked Slots"
            value={scheduleData?.stats.bookedSlots ?? 0}
            subtitle={`${scheduleData?.stats.utilizationPercentage ?? 0}% utilization`}
            icon={Clock}
            color="indigo"
          />
          <StatCard
            title="Total Laboratories"
            value={scheduleData?.stats.totalLabs ?? 29}
            subtitle="Across 9 departments"
            icon={Building}
            color="amber"
          />
        </div>
      )}

      {/* Grid: Upcoming Bookings & Lab Quick Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Upcoming Bookings */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                My Upcoming Lab Reservations
              </h2>
              <p className="text-xs text-slate-500">Upcoming sessions booked under your faculty account</p>
            </div>
            <Link
              to="/my-bookings"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingSkeleton rows={3} height="h-16" />
          ) : upcomingBookings.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <BookmarkCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No upcoming laboratory bookings</p>
              <p className="text-xs text-slate-400 mt-0.5">Click the Book Laboratory button above to reserve a slot.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingBookings.map(b => (
                <div key={b.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700">{b.booking_id}</span>
                      <span className="text-xs font-bold text-slate-800">{b.lab_name}</span>
                      <Badge variant="booked" size="sm" label={b.period} />
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>{b.subject_name}</strong> • {b.year_name} ({b.section_name})
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Date: <strong className="text-slate-600">{b.date}</strong></span>
                      <span>•</span>
                      <span>Time: {b.start_time} – {b.end_time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setSelectedBookingDetails(b)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => setSelectedBookingForCancel(b)}
                      className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Today's Operating Overview */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Today's Operating Day</h2>
              <p className="text-xs text-slate-500">P1 to P7 schedule status</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Today
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Operating Hours:</span>
              <span className="font-bold text-slate-800">9:30 AM – 4:30 PM</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Bookable Periods:</span>
              <span className="font-bold text-slate-800">7 Periods (P1–P7)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Lunch Break:</span>
              <span className="font-bold text-amber-700">1:00 PM – 2:00 PM (Non-bookable)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Available Labs:</span>
              <span className="font-bold text-emerald-700">29 Laboratories</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Fast Navigation</h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => navigate('/lab-schedule')}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left text-xs font-semibold text-slate-800 flex items-center justify-between transition cursor-pointer"
              >
                <span>Check Daily Lab Schedule Grid</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              </button>
              <button
                onClick={() => navigate('/book-lab')}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left text-xs font-semibold text-slate-800 flex items-center justify-between transition cursor-pointer"
              >
                <span>Reserve a Specific Lab Period</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              </button>
              <button
                onClick={() => navigate('/my-bookings')}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left text-xs font-semibold text-slate-800 flex items-center justify-between transition cursor-pointer"
              >
                <span>View Full Booking History & Receipts</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      <ConfirmationModal
        isOpen={Boolean(selectedBookingForCancel)}
        title="Cancel Laboratory Reservation"
        message={`Are you sure you want to cancel booking ${selectedBookingForCancel?.booking_id} for '${selectedBookingForCancel?.lab_name}' on ${selectedBookingForCancel?.date} (${selectedBookingForCancel?.period})? The slot will immediately become available for other faculty.`}
        confirmLabel="Confirm Cancellation"
        isDestructive={true}
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          setSelectedBookingForCancel(null);
          setCancelReason('');
        }}
      >
        <div className="mt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for Cancellation (Optional)
          </label>
          <input
            type="text"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="e.g. Schedule adjustment, faculty meeting"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
          />
        </div>
      </ConfirmationModal>

      {/* Details Modal */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{selectedBookingDetails.booking_id}</span>
                <h3 className="text-base font-bold text-slate-900">{selectedBookingDetails.lab_name}</h3>
              </div>
              <Badge variant={selectedBookingDetails.status === 'BOOKED' ? 'booked' : 'cancelled'} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Date & Time</span>
                <span className="font-bold text-slate-900">{selectedBookingDetails.date}</span>
                <span className="block text-slate-600">{selectedBookingDetails.period} ({selectedBookingDetails.start_time} – {selectedBookingDetails.end_time})</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Faculty Assigned</span>
                <span className="font-bold text-slate-900">{selectedBookingDetails.faculty_name}</span>
                <span className="block text-slate-600">{selectedBookingDetails.department_code}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Course / Subject</span>
                <span className="font-bold text-slate-900">{selectedBookingDetails.subject_name}</span>
                <span className="block text-slate-600 font-mono text-[11px]">{selectedBookingDetails.subject_code}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Batch & Students</span>
                <span className="font-bold text-slate-900">{selectedBookingDetails.year_name} • {selectedBookingDetails.section_name}</span>
                <span className="block text-slate-600">Expected: {selectedBookingDetails.expected_students || 'Not specified'}</span>
              </div>
            </div>

            {selectedBookingDetails.remarks && (
              <div className="p-3 bg-blue-50/50 rounded-xl text-xs text-slate-700">
                <span className="font-semibold text-blue-900">Remarks: </span>
                <span>{selectedBookingDetails.remarks}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
