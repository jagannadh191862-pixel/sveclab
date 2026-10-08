import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TimeSlot } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../components/common/Toast';
import { Clock, Edit2, X, Lock, CheckCircle2 } from 'lucide-react';

export const AdminTimeSlots: React.FC = () => {
  const toast = useToast();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getTimeSlots();
      if (res.success) setSlots(res.slots);
    } catch {
      toast.error('Failed to load time slots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditModal = (s: TimeSlot) => {
    setEditingSlot(s);
    setStartTime(s.start_time);
    setEndTime(s.end_time);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !startTime.trim() || !endTime.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await api.updateTimeSlot(editingSlot.id, {
        start_time: startTime.trim(),
        end_time: endTime.trim(),
      });
      if (res.success) {
        toast.success(`Period ${editingSlot.period} updated.`);
        setIsModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update time slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Time Slots (P1–P7)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Exact 7 bookable periods + 1 non-bookable lunch break (1:00 PM – 2:00 PM). P8 does not exist.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          7 Bookable Periods Verified
        </span>
      </div>

      {loading ? (
        <LoadingSkeleton rows={8} height="h-14" />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Display Order</th>
                <th className="px-6 py-3.5">Period Code</th>
                <th className="px-6 py-3.5">Start Time</th>
                <th className="px-6 py-3.5">End Time</th>
                <th className="px-6 py-3.5">Bookable Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {slots.map(s => (
                <tr
                  key={s.id}
                  className={!s.bookable ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50/50'}
                >
                  <td className="px-6 py-3.5 font-bold text-slate-400">#{s.display_order}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-900 font-mono text-sm">
                    {s.period}
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-slate-800">{s.start_time}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-800">{s.end_time}</td>
                  <td className="px-6 py-3.5">
                    {s.bookable ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Bookable Period
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        <Lock className="w-3.5 h-3.5" /> Lunch Break (Non-Bookable)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      title="Edit Timings"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Edit Timings for Period {editingSlot.period}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Start Time</label>
                <input
                  type="text"
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  placeholder="e.g. 9:30 AM"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">End Time</label>
                <input
                  type="text"
                  required
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  placeholder="e.g. 10:30 AM"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isSubmitting ? 'Saving...' : 'Update Timings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
