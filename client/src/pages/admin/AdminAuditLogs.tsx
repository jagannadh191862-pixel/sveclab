import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../components/common/Toast';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileCode
} from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const toast = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [actionFilter, setActionFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        page,
        limit: 20,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        search: search.trim() || undefined,
      });

      if (res.success) {
        setLogs(res.logs);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch {
      toast.error('Failed to load audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATED':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">CREATED</span>;
      case 'MODIFIED':
        return <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">MODIFIED</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">CANCELLED</span>;
      case 'DELETED':
        return <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold border border-gray-300">DELETED</span>;
      case 'ADMIN_BOOKING_CREATED':
        return <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">ADMIN CREATE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable surveillance log tracking all laboratory bookings, updates, and cancellations.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          {total} Immutable Log Entries
        </span>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={e => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATED">CREATED</option>
            <option value="ADMIN_BOOKING_CREATED">ADMIN_BOOKING_CREATED</option>
            <option value="MODIFIED">MODIFIED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="DELETED">DELETED</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search booking ID or user..."
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
      </div>

      {/* Logs Table */}
      {loading ? (
        <LoadingSkeleton rows={10} height="h-14" />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No audit entries found"
          description="There are no audit events matching the selected filter."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Booking ID</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Performed By</th>
                  <th className="px-4 py-3.5">Reason / Justification</th>
                  <th className="px-5 py-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-blue-700">
                      {log.booking_id}
                    </td>
                    <td className="px-4 py-3.5">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{log.performed_by_name}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{log.performed_by_role}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate" title={log.reason}>
                      {log.reason || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        title="View Detailed Payload"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
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

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">Log Entry #{selectedLog.id}</span>
                <h3 className="text-base font-bold text-slate-900">Booking {selectedLog.booking_id}</h3>
              </div>
              {getActionBadge(selectedLog.action)}
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p><strong>Actor:</strong> {selectedLog.performed_by_name} ({selectedLog.performed_by_role})</p>
                <p><strong>Timestamp:</strong> {selectedLog.timestamp}</p>
                <p><strong>Reason:</strong> {selectedLog.reason || 'None provided'}</p>
              </div>

              {selectedLog.old_value && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Old State / Value:</label>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto">
                    {selectedLog.old_value}
                  </pre>
                </div>
              )}

              {selectedLog.new_value && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">New State / Value:</label>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto">
                    {selectedLog.new_value}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
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
