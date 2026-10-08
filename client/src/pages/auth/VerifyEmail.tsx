import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { CheckCircle2, AlertCircle, MailCheck, ArrowRight } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const toast = useToast();

  const handleVerify = async (tokenToUse?: string) => {
    const t = tokenToUse || token;
    if (!t) {
      setErrorMsg('Please enter or paste your verification token.');
      return;
    }
    setErrorMsg('');
    setIsVerifying(true);

    try {
      const res = await api.verifyEmail(t);
      if (res.success) {
        setIsSuccess(true);
        toast.success(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Token may be invalid or expired.');
      toast.error(err.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-800">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
          <MailCheck className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Your Email</h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete email verification to confirm your identity and unlock laboratory booking privileges.
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <p className="font-bold text-sm">Email Verified Successfully!</p>
              <p className="text-emerald-700">Your account is fully activated. You can now log in.</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 text-left">
                Verification Token
              </label>
              <input
                type="text"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Paste verification token"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => handleVerify()}
              disabled={isVerifying}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Confirm Verification'}
            </button>

            <div className="pt-2 text-xs text-slate-500">
              Back to{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
