import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { Department } from '../../types';
import { Building2, Lock, Mail, User, BadgeAlert, ArrowRight, ShieldCheck } from 'lucide-react';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allowedDomain, setAllowedDomain] = useState<string>('');
  const [requireDomain, setRequireDomain] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    // Load public settings for domain restriction
    api.getPublicSettings().then(res => {
      if (res.success && res.settings) {
        setAllowedDomain(res.settings.allowed_email_domain || '');
        setRequireDomain(Boolean(res.settings.require_email_domain));
      }
    }).catch(() => {});

    // Load departments
    fetch('/api/master/departments')
      .then(res => res.json())
      .then(data => {
        if (data.departments) setDepartments(data.departments);
      })
      .catch(() => {});
  }, []);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (requireDomain && allowedDomain) {
      if (!email.toLowerCase().endsWith(allowedDomain.toLowerCase())) {
        setErrorMsg(`Registration is strictly restricted to institutional domain (${allowedDomain}).`);
        return;
      }
    }

    try {
      setIsLoading(true);
      const res = await api.register({
        name,
        employee_id: employeeId,
        email,
        password,
        department_id: departmentId || null,
      });

      if (res.success) {
        toast.success(res.message);
        if (res.verificationToken) {
          navigate(`/verify-email?token=${res.verificationToken}`);
        } else {
          navigate('/verify-email');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
      toast.error(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-800">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-sm mb-2 shadow-md shadow-blue-500/20">
            SVEC
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Faculty Account</h2>
          <p className="text-xs text-slate-500">Sri Vasavi Engineering College — Lab Scheduler</p>
        </div>

        {requireDomain && allowedDomain && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-800 font-medium">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Registration requires college domain: <strong>{allowedDomain}</strong></span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignupSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dr. K. Srinivas"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Employee ID
              </label>
              <div className="relative">
                <BadgeAlert className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  placeholder="e.g. SVEC-FAC-102"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@svec.ac.in"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Department
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <select
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
