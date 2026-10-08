import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Lab, Department } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../components/common/Toast';
import {
  Building2,
  Plus,
  Edit2,
  Power,
  Search,
  Filter,
  Users,
  CheckCircle2,
  X
} from 'lucide-react';

export const AdminLabs: React.FC = () => {
  const toast = useToast();

  const [labs, setLabs] = useState<Lab[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);

  // Form State
  const [labName, setLabName] = useState('');
  const [department, setDepartment] = useState('');
  const [buildingBlock, setBuildingBlock] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState<string>('72');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [labsRes, deptsRes] = await Promise.all([
        api.getLabs({
          department: deptFilter !== 'ALL' ? deptFilter : undefined,
          search: search.trim() || undefined,
        }),
        api.getDepartments(),
      ]);

      if (labsRes.success) setLabs(labsRes.labs);
      if (deptsRes.success) setDepartments(deptsRes.departments);
    } catch (err: any) {
      toast.error('Failed to load laboratories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [deptFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openCreateModal = () => {
    setEditingLab(null);
    setLabName('');
    setDepartment(departments[0]?.code || 'CSE');
    setBuildingBlock('');
    setRoomNumber('');
    setCapacity('72');
    setRemarks('');
    setIsModalOpen(true);
  };

  const openEditModal = (lab: Lab) => {
    setEditingLab(lab);
    setLabName(lab.lab_name);
    setDepartment(lab.department);
    setBuildingBlock(lab.building_block);
    setRoomNumber(lab.room_number || '');
    setCapacity(String(lab.capacity));
    setRemarks(lab.remarks || '');
    setIsModalOpen(true);
  };

  const handleSaveLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labName.trim() || !capacity) return;

    try {
      setIsSubmitting(true);
      if (editingLab) {
        const res = await api.updateLab(editingLab.id, {
          lab_name: labName.trim(),
          department,
          building_block: buildingBlock.trim(),
          room_number: roomNumber.trim(),
          capacity: parseInt(capacity, 10),
          remarks: remarks.trim(),
        });
        if (res.success) {
          toast.success('Laboratory updated successfully.');
          setIsModalOpen(false);
          loadData();
        }
      } else {
        const res = await api.createLab({
          lab_name: labName.trim(),
          department,
          building_block: buildingBlock.trim(),
          room_number: roomNumber.trim(),
          capacity: parseInt(capacity, 10),
          remarks: remarks.trim(),
        });
        if (res.success) {
          toast.success('Laboratory created successfully.');
          setIsModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save laboratory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (lab: Lab) => {
    try {
      const res = await api.toggleLabStatus(lab.id);
      if (res.success) {
        toast.success(res.message);
        loadData();
      }
    } catch (err: any) {
      toast.error('Failed to change laboratory status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Laboratories Directory (29 Verified College Labs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Exact inventory loaded from Excel, with student capacities and building locations.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Laboratory</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="w-full sm:w-60 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
          >
            <option value="ALL">All Departments (29 Labs)</option>
            {departments.map(d => (
              <option key={d.id} value={d.code}>{d.code} - {d.name}</option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search lab name or block..."
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

      {/* Laboratories Table */}
      {loading ? (
        <LoadingSkeleton rows={10} height="h-14" />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Lab Code</th>
                  <th className="px-4 py-3.5">Laboratory Name</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Building & Room</th>
                  <th className="px-4 py-3.5">Capacity</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {labs.map(lab => (
                  <tr key={lab.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-700">
                      {lab.lab_id}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {lab.lab_name}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {lab.department}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800">{lab.building_block}</div>
                      <div className="text-[11px] text-slate-500">{lab.room_number || 'Room N/A'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {lab.capacity} Students
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={lab.status === 'active' ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(lab)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                          title="Edit Lab"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(lab)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            lab.status === 'active'
                              ? 'border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={lab.status === 'active' ? 'Deactivate Lab' : 'Activate Lab'}
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
        </div>
      )}

      {/* Add / Edit Laboratory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingLab ? 'Edit Laboratory Details' : 'Add New Laboratory'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLab} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Laboratory Name</label>
                <input
                  type="text"
                  required
                  value={labName}
                  onChange={e => setLabName(e.target.value)}
                  placeholder="e.g. LINUS TURVALDS LAB"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Associated Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.code}>{d.code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Capacity (Students)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Building / Block</label>
                  <input
                    type="text"
                    value={buildingBlock}
                    onChange={e => setBuildingBlock(e.target.value)}
                    placeholder="e.g. Visvesvaraya Block"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Room Number</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    placeholder="e.g. VB-201"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="e.g. High Performance GPU workstations"
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Laboratory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
