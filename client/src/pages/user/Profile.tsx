import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Department } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';
import {
  User,
  Mail,
  Building,
  Shield,
  KeyRound,
  CheckCircle2,
  BadgeAlert,
  Save
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [departmentId, setDepartmentId] = useState<number | ''>(user?.departmentId || '');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setDepartmentId(user.departmentId || '');
    }
    api.getDepartments().then(res => {
      if (res.success) setDepartments(res.departments);
    });
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsUpdatingProfile(true);
      const res = await api.updateProfile({
        name: name.trim(),
        department_id: departmentId ? Number(departmentId) : null,
      });
      if (res.success) {
        toast.success('Profile updated successfully.');
        refreshUser();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        toast.success(res.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{user?.name}</h1>
              <Badge variant={user?.role === 'administrator' ? 'admin' : 'user'} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Employee ID: <span className="font-mono font-bold text-slate-700">{user?.employeeId}</span> • {user?.departmentName}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info & Edit */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
            <p className="text-xs text-slate-500">Update your faculty profile details</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Official Email (Read-only)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  readOnly
                  value={user?.email || ''}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-500 bg-slate-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Department
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <select
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Department Assigned</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                System Role (Assigned by Administrator)
              </label>
              <input
                type="text"
                readOnly
                value={user?.role === 'administrator' ? 'Administrator' : 'Faculty Member'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50 cursor-not-allowed capitalize"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Security & Credentials</h2>
            <p className="text-xs text-slate-500">Update your access password</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Current Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                New Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Shield className="w-4 h-4" />
              <span>{isChangingPassword ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
