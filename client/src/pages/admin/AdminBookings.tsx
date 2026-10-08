import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Booking, Department, Lab, Faculty } from '../../types';
import { Badge } from '../../components/common/Badge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../components/common/Toast';
import {
  CalendarCheck,
  Search,
  Filter,
  Eye,
  Edit3,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  RotateCcw
} from 'lucide-react';

export const AdminBookings: React.FC = () => {
  const toast = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [departmentId, setDepartmentId] = useState('ALL');
  const [labId, setLabId] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdowns
  const [departments, setDepartments] = useState<Department[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);

  // Action modals
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [deleteModalBooking, setDeleteModalBooking] = useState<Booking | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    api.getDepartments().then(res => {
      if (res.success) setDepartments(res.departments);
    });
    api.getLabs().then(res => {
      if (res.success) setLabs(res.labs);
    });
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await api.getAllBookings({
        page,
        limit: 15,
        search: search.trim() || undefined,
        status: status !== 'ALL' ? status : undefined,
        department_id: departmentId !== 'ALL' ? departmentId : undefined,
        lab_id: labId !== 'ALL' ? labId : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res.success) {
        setBookings(res.bookings);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (err: any) {
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [page, status, departmentId, labId, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadBookings();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setDepartmentId('ALL');
    setLabId('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    try {
      setIsProcessing(true);
      const res = await api.cancelBooking(cancelModalBooking.id, cancelReason || 'Administrative cancellation');
      if (res.success) {
        toast.success(res.message);
        setCancelModalBooking(null);
        setCancelReason('');
        loadBookings();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalBooking) return;
    try {
      setIsProcessing(true);
      const res = await api.adminDeleteBooking(deleteModalBooking.id, deleteReason || 'Administrative purge');
      if (res.success) {
        toast.success(res.message);
        setDeleteModalBooking(null);
        setDeleteReason('');
        loadBookings();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete booking.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Bookings Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, inspect audit records, and manage all laboratory bookings college-wide.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {total} Matching Records
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Department Filter */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Department</label>
            <select
              value={departmentId}
              onChange={e => {
                setDepartmentId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.code}</option>
              ))}
            </select>
          </div>

          {/* Lab Filter */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Laboratory</label>
            <select
              value={labId}
              onChange={e => {
                setLabId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="ALL">All 29 Laboratories</option>
              {labs.map(l => (
                <option key={l.id} value={l.id}>{l.lab_name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Status</label>
            <select
              value={status}
              onChange={e => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="BOOKED">Active (BOOKED)</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-96">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search booking ID, faculty, lab, subject..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
            >
              Search
            </button>
          </form>

          <button
            onClick={handleResetFilters}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={8} height="h-14" />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings match your filter"
          description="Try broadening your search parameters or clearing your date range filters."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Booking ID</th>
                  <th className="px-4 py-3.5">Date & Slot</th>
                  <th className="px-4 py-3.5">Laboratory</th>
                  <th className="px-4 py-3.5">Faculty</th>
                  <th className="px-4 py-3.5">Subject & Batch</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-700">
                      {b.booking_id}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{b.date}</div>
                      <div className="text-[11px] text-slate-500">{b.period} ({b.start_time})</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{b.lab_name}</div>
                      <div className="text-[11px] text-slate-500">{b.department_code}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{b.faculty_name}</div>
                      <div className="text-[11px] text-slate-400">Booked by: {b.booked_by_name}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{b.subject_name}</div>
                      <div className="text-[11px] text-slate-500">{b.year_name} ({b.section_name})</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={b.status === 'BOOKED' ? 'booked' : 'cancelled'} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewBooking(b)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {b.status === 'BOOKED' && (
                          <button
                            onClick={() => setCancelModalBooking(b)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteModalBooking(b)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Permanently Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {totalPages || 1}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{viewBooking.booking_id}</span>
                <h3 className="text-base font-bold text-slate-900">{viewBooking.lab_name}</h3>
              </div>
              <Badge variant={viewBooking.status === 'BOOKED' ? 'booked' : 'cancelled'} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Schedule</span>
                <span className="font-bold text-slate-900">{viewBooking.date}</span>
                <span className="block text-slate-600">{viewBooking.period} ({viewBooking.start_time} – {viewBooking.end_time})</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Faculty Member</span>
                <span className="font-bold text-slate-900">{viewBooking.faculty_name}</span>
                <span className="block text-slate-600">{viewBooking.department_code}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Subject / Course</span>
                <span className="font-bold text-slate-900">{viewBooking.subject_name}</span>
                <span className="block font-mono text-[11px] text-slate-600">{viewBooking.subject_code}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Batch</span>
                <span className="font-bold text-slate-900">{viewBooking.year_name} • {viewBooking.section_name}</span>
                <span className="block text-slate-600">Expected: {viewBooking.expected_students || 'Not specified'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Audit</span>
              <p>Booked by: <strong>{viewBooking.booked_by_name}</strong> ({viewBooking.booked_by_email})</p>
              <p className="text-slate-500 text-[11px]">Timestamp: {viewBooking.created_at}</p>
            </div>

            {viewBooking.status === 'CANCELLED' && (
              <div className="p-3 bg-rose-50 rounded-xl text-xs text-rose-800">
                <p className="font-bold">Cancellation Reason:</p>
                <p>{viewBooking.cancellation_reason || 'Administrative cancellation'}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewBooking(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      <ConfirmationModal
        isOpen={Boolean(cancelModalBooking)}
        title="Admin Cancellation"
        message={`Are you sure you want to administratively cancel booking ${cancelModalBooking?.booking_id}? The slot will be released for re-booking.`}
        confirmLabel="Confirm Cancellation"
        isDestructive={true}
        isLoading={isProcessing}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelModalBooking(null)}
      >
        <div className="mt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Cancellation Reason</label>
          <input
            type="text"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Reason for administrative cancellation"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
          />
        </div>
      </ConfirmationModal>

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteModalBooking)}
        title="Permanently Delete Booking Record"
        message={`Are you sure you want to permanently purge booking ${deleteModalBooking?.booking_id}? This operation writes to the audit log and permanently deletes the record.`}
        confirmLabel="Permanently Delete"
        isDestructive={true}
        isLoading={isProcessing}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalBooking(null)}
      >
        <div className="mt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Purge</label>
          <input
            type="text"
            value={deleteReason}
            onChange={e => setDeleteReason(e.target.value)}
            placeholder="e.g. Erroneous testing record, database cleanup"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
          />
        </div>
      </ConfirmationModal>
    </div>
  );
};
