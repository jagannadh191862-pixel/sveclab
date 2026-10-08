import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { KeyRound, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState('');

  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsLoading(true);
      const res = await api.forgotPassword(email.trim());
      setInfoMsg(res.message);
      toast.info(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to process request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-800">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password</h2>
          <p className="text-xs text-slate-500">
            Enter your official institutional email to generate a password reset token.
          </p>
        </div>

        {infoMsg && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-2">
            <p className="font-semibold">{infoMsg}</p>
            {resetToken && (
              <div className="p-2.5 bg-white rounded-xl border border-blue-200 space-y-2">
                <p className="text-[11px] text-slate-500 font-medium">Generated Reset Token:</p>
                <p className="font-mono text-xs text-blue-700 break-all select-all">{resetToken}</p>
                <button
                  onClick={() => navigate(`/reset-password?token=${resetToken}`)}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition"
                >
                  Proceed to Reset Password
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="faculty@svec.ac.in"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Generating Link...' : 'Request Password Reset'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
