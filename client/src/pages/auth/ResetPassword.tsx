import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const toast = useToast();

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token.trim()) {
      setErrorMsg('Reset token is required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.resetPassword({ token: token.trim(), newPassword });
      if (res.success) {
        setIsSuccess(true);
        toast.success(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
      toast.error(err.message || 'Reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-800">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Set New Password</h2>
          <p className="text-xs text-slate-500">
            Create a secure new password for your Sri Vasavi Engineering College account.
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4 text-center animate-in fade-in">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <p className="font-bold text-sm">Password Reset Successful!</p>
              <p className="text-emerald-700">You may now log in using your newly configured password.</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Reset Token
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Paste reset token"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Updating Password...' : 'Reset Password'}
            </button>

            <div className="text-center text-xs text-slate-500 pt-1">
              Back to{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
