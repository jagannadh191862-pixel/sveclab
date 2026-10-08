import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Faculty, Department } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../components/common/Toast';
import { UserCheck, Plus, Edit2, X, Filter } from 'lucide-react';

export const AdminFaculty: React.FC = () => {
  const toast = useToast();
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [facRes, deptsRes] = await Promise.all([
        api.getFaculty({ department_id: selectedDept !== 'ALL' ? Number(selectedDept) : undefined }),
        api.getDepartments(),
      ]);

      if (facRes.success) setFacultyList(facRes.faculty);
      if (deptsRes.success) {
        setDepartments(deptsRes.departments);
        if (!departmentId && deptsRes.departments.length > 0) setDepartmentId(deptsRes.departments[0].id);
      }
    } catch {
      toast.error('Failed to load faculty.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept]);

  const openCreateModal = () => {
    setEditingFaculty(null);
    setName('');
    setEmail('');
    setDesignation('Assistant Professor');
    setIsModalOpen(true);
  };

  const openEditModal = (f: Faculty) => {
    setEditingFaculty(f);
    setName(f.name);
    setDepartmentId(f.department_id);
    setEmail(f.email || '');
    setDesignation(f.designation || 'Assistant Professor');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !departmentId) return;

    try {
      setIsSubmitting(true);
      if (editingFaculty) {
        const res = await api.updateFaculty(editingFaculty.id, {
          name: name.trim(),
          department_id: Number(departmentId),
          email: email.trim() || undefined,
          designation: designation.trim(),
        });
        if (res.success) {
          toast.success('Faculty updated.');
          setIsModalOpen(false);
          loadData();
        }
      } else {
        const res = await api.createFaculty({
          name: name.trim(),
          department_id: Number(departmentId),
          email: email.trim() || undefined,
          designation: designation.trim(),
        });
        if (res.success) {
          toast.success('Faculty created.');
          setIsModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save faculty member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Faculty Directory Master</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure institutional professors, lecturers, and lab instructors.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty Member</span>
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
                <th className="px-6 py-3.5">Faculty Name</th>
                <th className="px-6 py-3.5">Designation</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Official Email</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {facultyList.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-3.5 font-bold text-slate-900">{f.name}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-600">{f.designation}</td>
                  <td className="px-6 py-3.5 font-semibold text-blue-700">{f.department_code}</td>
                  <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">{f.email || 'N/A'}</td>
                  <td className="px-6 py-3.5">
                    <Badge variant={f.status === 'active' ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => openEditModal(f)}
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
                {editingFaculty ? 'Edit Faculty Member' : 'Add Faculty Member'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dr. Ravi Kumar"
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

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Designation</label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  placeholder="e.g. Associate Professor & HOD"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Official Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. ravi.kumar@svec.ac.in"
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
                  {isSubmitting ? 'Saving...' : 'Save Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
