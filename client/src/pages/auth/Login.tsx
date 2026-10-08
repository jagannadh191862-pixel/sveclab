import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.login({ email: email.trim(), password });
      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        toast.success(`Welcome back, ${res.user.name}!`);
        if (res.user.role === 'administrator') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
      toast.error(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickCredentials = (userType: 'admin' | 'faculty') => {
    if (userType === 'admin') {
      setEmail('admin@svec.ac.in');
      setPassword('Admin@SVEC2026');
    } else {
      setEmail('faculty@svec.ac.in');
      setPassword('Faculty@SVEC2026');
    }
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-800">
      {/* Left Column: Institutional College Visual & Branding */}
      <div className="lg:w-1/2 bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        {/* Top college badge */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              SVEC
            </div>
            <div>
              <h1 className="text-sm lg:text-base font-bold tracking-tight text-white leading-none">
                SRI VASAVI ENGINEERING COLLEGE
              </h1>
              <p className="text-xs text-blue-300 mt-1">Autonomous Institution • Pedatadepalli</p>
            </div>
          </div>
        </div>

        {/* Center narrative */}
        <div className="relative z-10 my-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Official Laboratory Management System</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Seamless Laboratory Scheduling & Academic Session Allocation
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            A centralized institutional platform managing 29 laboratories across all engineering
            departments. Built with database-level double-booking protection and operational compliance.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full inventory of 29 College Labs & Seminar Halls from Excel</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Seven bookable periods (P1–P7) with mandatory 1:00–2:00 PM break</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Transaction-safe atomic lock prevents concurrent double bookings</span>
            </div>
          </div>
        </div>

        {/* Bottom meta */}
        <div className="relative z-10 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>SVEC Lab Scheduler v2.0</span>
          <span>Academic Year 2026–2027</span>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-md space-y-7">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to Your Account</h3>
            <p className="text-sm text-slate-500 mt-1">
              Enter your college credentials to manage or reserve laboratory slots.
            </p>
          </div>

          {/* Quick Demo Switcher Buttons */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900">Demo Accounts Available:</span>
              <span className="text-[11px] text-blue-700">Click to autofill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials('admin')}
                className="px-3 py-1.5 rounded-xl bg-white border border-blue-200 hover:border-blue-400 text-xs font-semibold text-blue-900 text-left transition shadow-2xs cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span>Administrator</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">admin@svec.ac.in</div>
              </button>

              <button
                type="button"
                onClick={() => fillQuickCredentials('faculty')}
                className="px-3 py-1.5 rounded-xl bg-white border border-blue-200 hover:border-blue-400 text-xs font-semibold text-blue-900 text-left transition shadow-2xs cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span>Faculty User</span>
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">faculty@svec.ac.in</div>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium leading-relaxed animate-in fade-in">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. srinivas.k@svec.ac.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-bold">
              Register New Faculty Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
