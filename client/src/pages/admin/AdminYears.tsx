import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Year } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../components/common/Toast';
import { GraduationCap, Plus, Edit2, X } from 'lucide-react';

export const AdminYears: React.FC = () => {
  const toast = useToast();
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<Year | null>(null);
  const [yearName, setYearName] = useState('');
  const [displayOrder, setDisplayOrder] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getYears();
      if (res.success) setYears(res.years);
    } catch {
      toast.error('Failed to load academic years.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingYear(null);
    setYearName('');
    setDisplayOrder(String(years.length + 1));
    setIsModalOpen(true);
  };

  const openEditModal = (y: Year) => {
    setEditingYear(y);
    setYearName(y.year_name);
    setDisplayOrder(String(y.display_order));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearName.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingYear) {
        const res = await api.updateYear(editingYear.id, {
          year_name: yearName.trim(),
          display_order: parseInt(displayOrder, 10),
        });
        if (res.success) {
          toast.success('Academic year updated.');
          setIsModalOpen(false);
          loadData();
        }
      } else {
        const res = await api.createYear({
          year_name: yearName.trim(),
          display_order: parseInt(displayOrder, 10),
        });
        if (res.success) {
          toast.success('Academic year created.');
          setIsModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save academic year.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Academic Years Master</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure I B.Tech through IV B.Tech, Diploma, and Postgraduate academic years.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Academic Year</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} height="h-14" />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Order</th>
                <th className="px-6 py-3.5">Academic Year Level</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {years.map(y => (
                <tr key={y.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3.5 font-bold text-slate-400">#{y.display_order}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-900">{y.year_name}</td>
                  <td className="px-6 py-3.5">
                    <Badge variant={y.status === 'active' ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => openEditModal(y)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      title="Edit"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingYear ? 'Edit Academic Year' : 'Add Academic Year'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Academic Year Label</label>
                <input
                  type="text"
                  required
                  value={yearName}
                  onChange={e => setYearName(e.target.value)}
                  placeholder="e.g. III B.Tech"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Display Sort Order</label>
                <input
                  type="number"
                  required
                  value={displayOrder}
                  onChange={e => setDisplayOrder(e.target.value)}
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
                  {isSubmitting ? 'Saving...' : 'Save Academic Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
