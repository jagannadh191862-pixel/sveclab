import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Department } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../components/common/Toast';
import { Layers, Plus, Edit2, Power, X } from 'lucide-react';

export const AdminDepartments: React.FC = () => {
  const toast = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getDepartments();
      if (res.success) setDepartments(res.departments);
    } catch {
      toast.error('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingDept(null);
    setCode('');
    setName('');
    setIsModalOpen(true);
  };

  const openEditModal = (d: Department) => {
    setEditingDept(d);
    setCode(d.code);
    setName(d.name);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingDept) {
        const res = await api.updateDepartment(editingDept.id, { code: code.trim(), name: name.trim() });
        if (res.success) {
          toast.success('Department updated successfully.');
          setIsModalOpen(false);
          loadData();
        }
      } else {
        const res = await api.createDepartment({ code: code.trim(), name: name.trim() });
        if (res.success) {
          toast.success('Department created successfully.');
          setIsModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (d: Department) => {
    const newStatus = d.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.updateDepartment(d.id, { status: newStatus });
      if (res.success) {
        toast.success(`Department is now ${newStatus}.`);
        loadData();
      }
    } catch (err: any) {
      toast.error('Failed to update status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Academic Departments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure institutional departments and divisions.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} height="h-14" />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Department Name</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {departments.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3.5 font-bold text-blue-700 font-mono">{d.code}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-900">{d.name}</td>
                  <td className="px-6 py-3.5">
                    <Badge variant={d.status === 'active' ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(d)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(d)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                        title="Toggle Status"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                {editingDept ? 'Edit Department' : 'Create Department'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="e.g. AI-DS"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Department Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence & Data Science"
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
                  {isSubmitting ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
