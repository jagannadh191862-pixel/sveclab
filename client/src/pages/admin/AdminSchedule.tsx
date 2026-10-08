import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ScheduleResponse, Booking, Department, Lab, Faculty } from '../../types';
import { ScheduleGrid } from '../../components/schedule/ScheduleGrid';
import { MobileScheduleView } from '../../components/schedule/MobileScheduleView';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  RefreshCw,
  Edit3,
  XCircle,
  PlusCircle,
  X,
  Building,
  UserCheck
} from 'lucide-react';

export const AdminSchedule: React.FC = () => {
  const toast = useToast();
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [detailsBooking, setDetailsBooking] = useState<Booking | null>(null);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Edit form state
  const [editSlotId, setEditSlotId] = useState<number>(0);
  const [editReason, setEditReason] = useState<string>('');

  // On-behalf booking quick modal
  const [onBehalfSlot, setOnBehalfSlot] = useState<{ labId: number; slotId: number } | null>(null);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | ''>('');

  useEffect(() => {
    api.getDepartments().then(res => {
      if (res.success) setDepartments(res.departments);
    });
    api.getFaculty().then(res => {
      if (res.success) setFacultyList(res.faculty);
    });
  }, []);

  const fetchSchedule = async (dateStr: string, deptStr: string, searchStr: string) => {
    try {
      setLoading(true);
      const res = await api.getSchedule({
        date: dateStr,
        department: deptStr,
        search: searchStr.trim() || undefined,
      });
      if (res.success) {
        setScheduleData(res);
      }
    } catch (err: any) {
      toast.error('Failed to load schedule matrix.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(selectedDate, selectedDepartment, searchQuery);
  }, [selectedDate, selectedDepartment]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(todayStr);
  };

  const handleSlotClick = (labId: number, slotId: number) => {
    // Admin click on available slot -> On-behalf booking quick drawer
    setOnBehalfSlot({ labId, slotId });
  };

  const handleConfirmCancel = async () => {
    if (!cancelBooking) return;
    try {
      setIsProcessing(true);
      const res = await api.cancelBooking(cancelBooking.id, cancelReason || 'Admin administrative cancellation');
      if (res.success) {
        toast.success(res.message);
        setCancelBooking(null);
        setCancelReason('');
        setDetailsBooking(null);
        fetchSchedule(selectedDate, selectedDepartment, searchQuery);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBooking) return;
    if (!editReason.trim()) {
      toast.error('A modification reason is mandatory for administrative changes.');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await api.adminUpdateBooking(editBooking.id, {
        slot_id: editSlotId || editBooking.slot_id,
        reason: editReason.trim(),
      });
      if (res.success) {
        toast.success(res.message);
        setEditBooking(null);
        setDetailsBooking(null);
        setEditReason('');
        fetchSchedule(selectedDate, selectedDepartment, searchQuery);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reschedule booking.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Live Schedule Matrix</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
              Admin Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full surveillance of all 29 labs. Edit, reschedule, or cancel any session with audit logging.
          </p>
        </div>

        {/* Date Selector Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                selectedDate === todayStr ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => fetchSchedule(selectedDate, selectedDepartment, searchQuery)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            className="w-full sm:w-60 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Departments (29 Labs)</option>
            {departments.map(d => (
              <option key={d.id} value={d.code}>{d.code} - {d.name}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              fetchSchedule(selectedDate, selectedDepartment, e.target.value);
            }}
            placeholder="Search lab name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Schedule Presentation */}
      {loading ? (
        <LoadingSkeleton rows={8} height="h-14" />
      ) : scheduleData ? (
        <>
          <div className="hidden md:block">
            <ScheduleGrid
              timeSlots={scheduleData.timeSlots}
              grid={scheduleData.grid}
              onSelectSlot={handleSlotClick}
              onViewBooking={b => setDetailsBooking(b)}
              isAdmin={true}
            />
          </div>

          <div className="md:hidden">
            <MobileScheduleView
              timeSlots={scheduleData.timeSlots}
              grid={scheduleData.grid}
              labs={scheduleData.labs}
              onSelectSlot={handleSlotClick}
              onViewBooking={b => setDetailsBooking(b)}
              isAdmin={true}
            />
          </div>
        </>
      ) : null}

      {/* Admin Booking Details & Actions Modal */}
      {detailsBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{detailsBooking.booking_id}</span>
                <h3 className="text-base font-bold text-slate-900">{detailsBooking.lab_name}</h3>
              </div>
              <Badge variant="booked" size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Schedule</span>
                <span className="font-bold text-slate-900">{detailsBooking.date}</span>
                <span className="block text-slate-600">{detailsBooking.period} ({detailsBooking.start_time} – {detailsBooking.end_time})</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Faculty</span>
                <span className="font-bold text-slate-900">{detailsBooking.faculty_name}</span>
                <span className="block text-slate-600">{detailsBooking.department_code}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Subject</span>
                <span className="font-bold text-slate-900">{detailsBooking.subject_name}</span>
                <span className="block font-mono text-[11px] text-slate-600">{detailsBooking.subject_code}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Batch</span>
                <span className="font-bold text-slate-900">{detailsBooking.year_name} • {detailsBooking.section_name}</span>
                <span className="block text-slate-600">Expected: {detailsBooking.expected_students || 'Not specified'}</span>
              </div>
            </div>

            {detailsBooking.remarks && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                <span className="font-bold text-slate-800">Remarks: </span>
                <span>{detailsBooking.remarks}</span>
              </div>
            )}

            {/* Admin Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditBooking(detailsBooking);
                    setEditSlotId(detailsBooking.slot_id);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Reschedule / Edit</span>
                </button>
                <button
                  onClick={() => setCancelBooking(detailsBooking)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Booking</span>
                </button>
              </div>

              <button
                onClick={() => setDetailsBooking(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Reschedule Modal */}
      {editBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Admin Reschedule: {editBooking.booking_id}
            </h3>
            <p className="text-xs text-slate-500">
              Change the time period for {editBooking.lab_name} on {editBooking.date}.
            </p>

            <form onSubmit={handleConfirmEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Operating Period
                </label>
                <select
                  value={editSlotId}
                  onChange={e => setEditSlotId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                >
                  {scheduleData?.timeSlots.filter(s => s.bookable).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.period} ({s.start_time} – {s.end_time})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Modification (Mandatory for Audit Trail)
                </label>
                <input
                  type="text"
                  required
                  value={editReason}
                  onChange={e => setEditReason(e.target.value)}
                  placeholder="e.g. Timetable conflict, Department head request"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditBooking(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                >
                  {isProcessing ? 'Updating...' : 'Save Modification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Cancellation Modal */}
      <ConfirmationModal
        isOpen={Boolean(cancelBooking)}
        title="Admin Cancellation"
        message={`Are you sure you want to administratively cancel booking ${cancelBooking?.booking_id} for ${cancelBooking?.lab_name}?`}
        confirmLabel="Confirm Cancellation"
        isDestructive={true}
        isLoading={isProcessing}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelBooking(null)}
      >
        <div className="mt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for Administrative Cancellation
          </label>
          <input
            type="text"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="e.g. Lab maintenance, urgent college seminar"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
          />
        </div>
      </ConfirmationModal>
    </div>
  );
};
