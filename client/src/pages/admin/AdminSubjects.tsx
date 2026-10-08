import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Subject, Department } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../components/common/Toast';
import { BookOpen, Plus, Edit2, X, Filter } from 'lucide-react';

export const AdminSubjects: React.FC = () => {
  const toast = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subsRes, deptsRes] = await Promise.all([
        api.getSubjects({ department_id: selectedDept !== 'ALL' ? Number(selectedDept) : undefined }),
        api.getDepartments(),
      ]);

      if (subsRes.success) setSubjects(subsRes.subjects);
      if (deptsRes.success) {
        setDepartments(deptsRes.departments);
        if (!departmentId && deptsRes.departments.length > 0) setDepartmentId(deptsRes.departments[0].id);
      }
    } catch {
      toast.error('Failed to load courses/subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept]);

  const openCreateModal = () => {
    setEditingSubject(null);
    setCode('');
    setName('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Subject) => {
    setEditingSubject(s);
    setCode(s.code);
    setName(s.name);
    setDepartmentId(s.department_id);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !departmentId) return;

    try {
      setIsSubmitting(true);
      if (editingSubject) {
        const res = await api.updateSubject(editingSubject.id, {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          department_id: Number(departmentId),
        });
        if (res.success) {
          toast.success('Subject updated.');
          setIsModalOpen(false);
          loadData();
        }
      } else {
        const res = await api.createSubject({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          department_id: Number(departmentId),
        });
        if (res.success) {
          toast.success('Subject created.');
          setIsModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Subjects & Courses Master</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure laboratory course codes and practical curriculum subjects.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course / Subject</span>
        </button>
      </div>

      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
        >
          <option value="ALL">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
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
                <th className="px-6 py-3.5">Course Code</th>
                <th className="px-6 py-3.5">Subject Name</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {subjects.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3.5 font-mono font-bold text-blue-700">{s.code}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-900">{s.name}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-600">{s.department_code}</td>
                  <td className="px-6 py-3.5">
                    <Badge variant={s.status === 'active' ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => openEditModal(s)}
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
                {editingSubject ? 'Edit Subject' : 'Add Subject'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="e.g. 23CS401L"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Course / Subject Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Web Technologies Laboratory"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <select
                  value={departmentId}
                  onChange={e => setDepartmentId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                  ))}
                </select>
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
                  {isSubmitting ? 'Saving...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
