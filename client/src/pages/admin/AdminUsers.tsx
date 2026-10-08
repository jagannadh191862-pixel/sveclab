import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Department } from '../../types';
import { Badge } from '../../components/common/Badge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../components/common/Toast';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  Power,
  ChevronLeft,
  ChevronRight,
  Mail,
  UserCheck
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [departments, setDepartments] = useState<Department[]>([]);

  // Action State
  const [confirmRoleUser, setConfirmRoleUser] = useState<User | null>(null);
  const [targetRole, setTargetRole] = useState<'user' | 'administrator'>('user');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    api.getDepartments().then(res => {
      if (res.success) setDepartments(res.departments);
    });
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers({
        page,
        limit: 15,
        search: search.trim() || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        department_id: deptFilter !== 'ALL' ? deptFilter : undefined,
      });

      if (res.success) {
        setUsers(res.users);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (err: any) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, statusFilter, deptFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.updateUserStatus(user.id, newStatus);
      if (res.success) {
        toast.success(res.message);
        loadUsers();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status.');
    }
  };

  const handlePromptRoleChange = (user: User) => {
    const newRole = user.role === 'administrator' ? 'user' : 'administrator';
    setTargetRole(newRole);
    setConfirmRoleUser(user);
  };

  const handleConfirmRoleChange = async () => {
    if (!confirmRoleUser) return;
    try {
      setIsProcessing(true);
      const res = await api.updateUserRole(confirmRoleUser.id, targetRole);
      if (res.success) {
        toast.success(res.message);
        setConfirmRoleUser(null);
        loadUsers();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional User Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage faculty and administrator permissions, roles, and access credentials.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {total} Registered Users
        </span>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={roleFilter}
            onChange={e => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
          >
            <option value="ALL">All Roles</option>
            <option value="user">Faculty Users</option>
            <option value="administrator">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, employee ID..."
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

      {/* Users Table */}
      {loading ? (
        <LoadingSkeleton rows={8} height="h-14" />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">User Code</th>
                  <th className="px-4 py-3.5">Employee ID</th>
                  <th className="px-4 py-3.5">Full Name & Email</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-700">
                      {u.userId}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-800 font-semibold">
                      {u.employeeId}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {u.departmentCode || 'Not Assigned'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={u.role === 'administrator' ? 'admin' : 'user'} />
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={u.status === 'active' ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePromptRoleChange(u)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Toggle Role"
                        >
                          <Shield className="w-3 h-3 text-blue-600" />
                          <span>{u.role === 'administrator' ? 'Demote' : 'Make Admin'}</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            u.status === 'active'
                              ? 'border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.status === 'active' ? 'Deactivate User' : 'Activate User'}
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

      {/* Role Change Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(confirmRoleUser)}
        title="Change User Authorization Role"
        message={`Are you sure you want to change the role of ${confirmRoleUser?.name} (${confirmRoleUser?.email}) to '${targetRole.toUpperCase()}'?`}
        confirmLabel="Confirm Role Change"
        isLoading={isProcessing}
        onConfirm={handleConfirmRoleChange}
        onCancel={() => setConfirmRoleUser(null)}
      />
    </div>
  );
};
