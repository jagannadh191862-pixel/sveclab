import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SystemSettings } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../components/common/Toast';
import { Settings, Save, ShieldCheck, Building2, Calendar, Lock } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings State
  const [collegeName, setCollegeName] = useState('Sri Vasavi Engineering College');
  const [systemTitle, setSystemTitle] = useState('SVEC Lab Scheduler');
  const [subtitle, setSubtitle] = useState('Laboratory Scheduling & Booking System');
  const [allowedDomain, setAllowedDomain] = useState('');
  const [requireDomain, setRequireDomain] = useState(false);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [allowRetrospective, setAllowRetrospective] = useState(true);

  useEffect(() => {
    api.getAdminSettings().then(res => {
      if (res.success && res.settings) {
        const s = res.settings;
        setCollegeName(s.college_name);
        setSystemTitle(s.system_title);
        setSubtitle(s.subtitle);
        setAllowedDomain(s.allowed_email_domain);
        setRequireDomain(Boolean(s.require_email_domain));
        setAcademicYear(s.academic_year);
        setAllowRetrospective(Boolean(s.allow_retrospective_booking_admin));
      }
    }).catch(() => {
      toast.error('Failed to load system settings.');
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await api.updateSettings({
        college_name: collegeName.trim(),
        system_title: systemTitle.trim(),
        subtitle: subtitle.trim(),
        allowed_email_domain: allowedDomain.trim(),
        require_email_domain: requireDomain ? 1 : 0,
        academic_year: academicYear.trim(),
        allow_retrospective_booking_admin: allowRetrospective ? 1 : 0,
      });

      if (res.success) {
        toast.success(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update system settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">System Configuration & Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global institution parameters, authentication constraints, and scheduling behavior.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} height="h-20" />
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Institutional Branding */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Institution Identity</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">College Name</label>
                <input
                  type="text"
                  required
                  value={collegeName}
                  onChange={e => setCollegeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">System Title</label>
                <input
                  type="text"
                  required
                  value={systemTitle}
                  onChange={e => setSystemTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Subtitle / Purpose</label>
                <input
                  type="text"
                  required
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Active Academic Year</label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* College Domain Authentication Setting (Section 5) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Official College Email Support</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <input
                  type="checkbox"
                  id="requireDomainCheck"
                  checked={requireDomain}
                  onChange={e => setRequireDomain(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="requireDomainCheck" className="cursor-pointer">
                  <span className="font-bold text-slate-900 block">Enforce Allowed Email Domain</span>
                  <span className="text-slate-500">
                    When enabled, new faculty user registrations will strictly be restricted to the specified domain below.
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Allowed Email Domain
                </label>
                <input
                  type="text"
                  value={allowedDomain}
                  onChange={e => setAllowedDomain(e.target.value)}
                  placeholder="e.g. @svec.ac.in or @examplecollege.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave blank or uncheck enforcement to allow normal verified emails without strict institutional domain restriction.
                </p>
              </div>
            </div>
          </div>

          {/* Operational Scheduling Policies */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Lock className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Operational Scheduling Constraints</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <input
                  type="checkbox"
                  id="retroBookingCheck"
                  checked={allowRetrospective}
                  onChange={e => setAllowRetrospective(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="retroBookingCheck" className="cursor-pointer">
                  <span className="font-bold text-slate-900 block">Allow Retrospective Corrections by Administrator</span>
                  <span className="text-slate-500">
                    Permits system administrators to perform retrospective adjustments on past date/time slots for institutional record-keeping.
                  </span>
                </label>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-medium">
                Mandatory rules enforced: Operating hours 9:30 AM – 4:30 PM (P1–P7), Break 1:00 PM – 2:00 PM (non-bookable), and database-level unique concurrency guard.
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Configurations...' : 'Save System Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
