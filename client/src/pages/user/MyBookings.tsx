import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Booking } from '../../types';
import { Badge } from '../../components/common/Badge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../components/common/Toast';
import {
  BookmarkCheck,
  Search,
  Filter,
  Eye,
  XCircle,
  Calendar,
  Building,
  Clock,
  BookOpen
} from 'lucide-react';

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const [detailsModalBooking, setDetailsModalBooking] = useState<Booking | null>(null);

  const toast = useToast();

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await api.getMyBookings({
        status: statusFilter,
        search: searchQuery.trim() || undefined,
      });
      if (res.success) {
        setBookings(res.bookings);
      }
    } catch (err: any) {
      toast.error('Failed to load your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBookings();
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    try {
      setIsCancelling(true);
      const res = await api.cancelBooking(cancelModalBooking.id, cancelReason);
      if (res.success) {
        toast.success(res.message);
        setCancelModalBooking(null);
        setCancelReason('');
        loadBookings();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel reservation.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Laboratory Reservations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View active bookings, historical records, and manage reservation cancellations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {bookings.length} Total Records
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="BOOKED">Active Bookings Only</option>
            <option value="CANCELLED">Cancelled Bookings</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search booking ID, lab, subject..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
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

      {/* Data Table */}
      {loading ? (
        <LoadingSkeleton rows={6} height="h-16" />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={BookmarkCheck}
          title="No reservations found"
          description="You do not have any laboratory reservations matching the selected filter criteria."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Booking ID</th>
                  <th className="px-4 py-3.5">Date & Time</th>
                  <th className="px-4 py-3.5">Laboratory</th>
                  <th className="px-4 py-3.5">Subject / Course</th>
                  <th className="px-4 py-3.5">Batch / Section</th>
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
                      <div className="text-[11px] text-slate-500">
                        {b.period} ({b.start_time} – {b.end_time})
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{b.lab_name}</div>
                      <div className="text-[11px] text-slate-500">{b.building_block}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{b.subject_name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{b.subject_code}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800">{b.year_name}</div>
                      <div className="text-[11px] text-slate-500">{b.section_name}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={b.status === 'BOOKED' ? 'booked' : 'cancelled'} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailsModalBooking(b)}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Dialog (Section 26) */}
      <ConfirmationModal
        isOpen={Boolean(cancelModalBooking)}
        title="Cancel Laboratory Reservation"
        message={`Are you sure you want to cancel this laboratory booking (${cancelModalBooking?.booking_id}) for ${cancelModalBooking?.lab_name} on ${cancelModalBooking?.date}? Once cancelled, the slot will be released back to the general pool for other faculty.`}
        confirmLabel="Confirm Cancellation"
        cancelLabel="Keep Booking"
        isDestructive={true}
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          setCancelModalBooking(null);
          setCancelReason('');
        }}
      >
        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for Cancellation (Required for Audit Trail)
          </label>
          <input
            type="text"
            required
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="e.g. Schedule adjustment, faculty meeting"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
          />
        </div>
      </ConfirmationModal>

      {/* Full Details Modal */}
      {detailsModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{detailsModalBooking.booking_id}</span>
                <h3 className="text-base font-bold text-slate-900">{detailsModalBooking.lab_name}</h3>
              </div>
              <Badge variant={detailsModalBooking.status === 'BOOKED' ? 'booked' : 'cancelled'} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Date & Time</span>
                <span className="font-bold text-slate-900">{detailsModalBooking.date}</span>
                <span className="block text-slate-600">{detailsModalBooking.period} ({detailsModalBooking.start_time} – {detailsModalBooking.end_time})</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Faculty Member</span>
                <span className="font-bold text-slate-900">{detailsModalBooking.faculty_name}</span>
                <span className="block text-slate-600">{detailsModalBooking.department_code}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Subject / Course</span>
                <span className="font-bold text-slate-900">{detailsModalBooking.subject_name}</span>
                <span className="block text-slate-600 font-mono text-[11px]">{detailsModalBooking.subject_code}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Batch & Students</span>
                <span className="font-bold text-slate-900">{detailsModalBooking.year_name} • {detailsModalBooking.section_name}</span>
                <span className="block text-slate-600">Expected: {detailsModalBooking.expected_students || 'Not specified'}</span>
              </div>
            </div>

            {detailsModalBooking.status === 'CANCELLED' && (
              <div className="p-3 bg-rose-50 rounded-xl text-xs text-rose-800 space-y-1">
                <p className="font-bold">Cancellation Record:</p>
                <p>Reason: {detailsModalBooking.cancellation_reason || 'No reason specified'}</p>
                <p className="text-[11px] text-rose-600">Cancelled at: {detailsModalBooking.cancelled_at}</p>
              </div>
            )}

            {detailsModalBooking.remarks && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                <span className="font-semibold text-slate-800">Remarks: </span>
                <span>{detailsModalBooking.remarks}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailsModalBooking(null)}
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
