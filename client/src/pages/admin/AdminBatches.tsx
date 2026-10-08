import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BatchSection, Department, Year } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../components/common/Toast';
import { UsersRound, Plus, Edit2, X, Filter } from 'lucide-react';

export const AdminBatches: React.FC = () => {
  const toast = useToast();
  const [batches, setBatches] = useState<BatchSection[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchSection | null>(null);
  const [deptId, setDeptId] = useState<number | ''>('');
  const [yrId, setYrId] = useState<number | ''>('');
  const [sectionName, setSectionName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [batchesRes, deptsRes, yearsRes] = await Promise.all([
        api.getBatches({
          department_id: selectedDept !== 'ALL' ? Number(selectedDept) : undefined,
          year_id: selectedYear !== 'ALL' ? Number(selectedYear) : undefined,
        }),
        api.getDepartments(),
        api.getYears(),
      ]);

      if (batchesRes.success) setBatches(batchesRes.batches);
      if (deptsRes.success) {
        setDepartments(deptsRes.departments);
        if (!deptId && deptsRes.departments.length > 0) setDeptId(deptsRes.departments[0].id);
      }
      if (yearsRes.success) {
        setYears(yearsRes.years);
        if (!yrId && yearsRes.years.length > 0) setYrId(yearsRes.years[0].id);
      }
    } catch {
      toast.error('Failed to load sections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept, selectedYear]);

  const openCreateModal = () => {
    setEditingBatch(null);
    setSectionName('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: BatchSection) => {
    setEditingBatch(b);
    setDeptId(b.department_id);
    setYrId(b.year_id);
    setSectionName(b.section_name);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptId || !yrId || !sectionName.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingBatch) {
        const res = await api.updateBatch(editingBatch.id, {
          section_name: sectionName.trim(),
        });
        if (res.success) {
          toast.success('Section updated.');
          setIsModalOpen(false);
          loadData();
        }
      } else {
        const res = await api.createBatch({
          department_id: Number(deptId),
          year_id: Number(yrId),
          section_name: sectionName.trim(),
        });
        if (res.success) {
          toast.success('Section created.');
          setIsModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save section.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Batches & Sections Master</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage section allocations (e.g. CSE Section A, Section B, CRT Batch 1).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Section / Batch</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
        >
          <option value="ALL">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.code}</option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
        >
          <option value="ALL">All Academic Years</option>
          {years.map(y => (
            <option key={y.id} value={y.id}>{y.year_name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} height="h-14" />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Year</th>
                <th className="px-6 py-3.5">Section / Batch</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {batches.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3.5 font-bold text-slate-900">{b.department_code}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-700">{b.year_name}</td>
                  <td className="px-6 py-3.5 font-bold text-blue-700">{b.section_name}</td>
                  <td className="px-6 py-3.5">
                    <Badge variant={b.status === 'active' ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => openEditModal(b)}
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
                {editingBatch ? 'Edit Section' : 'Create Section'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <select
                  disabled={Boolean(editingBatch)}
                  value={deptId}
                  onChange={e => setDeptId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Academic Year</label>
                <select
                  disabled={Boolean(editingBatch)}
                  value={yrId}
                  onChange={e => setYrId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {years.map(y => (
                    <option key={y.id} value={y.id}>{y.year_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Section / Batch Label</label>
                <input
                  type="text"
                  required
                  value={sectionName}
                  onChange={e => setSectionName(e.target.value)}
                  placeholder="e.g. Section C or Batch 2"
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
                  {isSubmitting ? 'Saving...' : 'Save Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
