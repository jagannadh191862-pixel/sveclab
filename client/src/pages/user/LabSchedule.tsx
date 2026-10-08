import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { ScheduleResponse, Booking, Department } from '../../types';
import { ScheduleGrid } from '../../components/schedule/ScheduleGrid';
import { MobileScheduleView } from '../../components/schedule/MobileScheduleView';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  RefreshCw,
  Building2,
  Clock,
  Info,
  X
} from 'lucide-react';

export const LabSchedule: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const initialDept = searchParams.get('department') || 'ALL';

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(initialDept);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeBookingModal, setActiveBookingModal] = useState<Booking | null>(null);

  // Load department list
  useEffect(() => {
    api.getDepartments().then(res => {
      if (res.success) setDepartments(res.departments);
    }).catch(() => {});
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
    setSearchParams({ date: selectedDate, department: selectedDepartment });
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
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleSelectSlot = (labId: number, slotId: number) => {
    navigate(`/book-lab?date=${selectedDate}&labId=${labId}&slotId=${slotId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSchedule(selectedDate, selectedDepartment, searchQuery);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isSelectedToday = selectedDate === todayStr;

  return (
    <div className="space-y-6">
      {/* Top Header & Operational Date Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daily Laboratory Schedule</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              Primary Grid
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time availability matrix across all 29 laboratories for Periods P1–P7
          </p>
        </div>

        {/* Date Selector Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                isSelectedToday
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
              title="Next Day"
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
            title="Refresh availability"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            className="w-full sm:w-60 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
          >
            <option value="ALL">All Departments (29 Labs)</option>
            {departments.map(d => (
              <option key={d.id} value={d.code}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search lab name or block..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Daily Statistics Summary Bar */}
      {scheduleData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Operating Date</span>
            <span className="font-bold text-slate-800">{scheduleData.date}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Labs Shown</span>
            <span className="font-bold text-blue-600">{scheduleData.stats.totalLabs} Laboratories</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Available Slots</span>
            <span className="font-bold text-emerald-600">{scheduleData.stats.availableSlots} Available</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Reserved Sessions</span>
            <span className="font-bold text-rose-600">
              {scheduleData.stats.bookedSlots} Booked ({scheduleData.stats.utilizationPercentage}% util)
            </span>
          </div>
        </div>
      )}

      {/* Schedule Presentation */}
      {loading ? (
        <LoadingSkeleton rows={8} height="h-14" />
      ) : scheduleData ? (
        <>
          {/* Desktop Matrix Grid */}
          <div className="hidden md:block">
            <ScheduleGrid
              timeSlots={scheduleData.timeSlots}
              grid={scheduleData.grid}
              onSelectSlot={handleSelectSlot}
              onViewBooking={b => setActiveBookingModal(b)}
            />
          </div>

          {/* Mobile Clean Card View */}
          <div className="md:hidden">
            <MobileScheduleView
              timeSlots={scheduleData.timeSlots}
              grid={scheduleData.grid}
              labs={scheduleData.labs}
              onSelectSlot={handleSelectSlot}
              onViewBooking={b => setActiveBookingModal(b)}
            />
          </div>
        </>
      ) : null}

      {/* Booking Details Modal */}
      {activeBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="font-mono text-xs font-bold text-blue-600">{activeBookingModal.booking_id}</span>
                <h3 className="text-base font-bold text-slate-900">{activeBookingModal.lab_name}</h3>
              </div>
              <Badge variant="booked" size="sm" label="Reserved" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Period & Schedule</span>
                <span className="font-bold text-slate-900">{activeBookingModal.period}</span>
                <span className="block text-slate-600">{activeBookingModal.start_time} – {activeBookingModal.end_time}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Faculty Member</span>
                <span className="font-bold text-slate-900">{activeBookingModal.faculty_name}</span>
                <span className="block text-slate-600">{activeBookingModal.department_name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Subject / Course</span>
                <span className="font-bold text-slate-900">{activeBookingModal.subject_name}</span>
                <span className="block text-slate-600 font-mono text-[11px]">{activeBookingModal.subject_code}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Batch Allocation</span>
                <span className="font-bold text-slate-900">{activeBookingModal.year_name}</span>
                <span className="block text-slate-600">{activeBookingModal.section_name}</span>
              </div>
            </div>

            {activeBookingModal.remarks && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                <span className="font-bold text-slate-800">Remarks: </span>
                <span>{activeBookingModal.remarks}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
              <span>Booked by: <strong>{activeBookingModal.booked_by_name}</strong></span>
              <button
                onClick={() => setActiveBookingModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
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
