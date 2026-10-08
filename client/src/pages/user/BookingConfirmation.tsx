import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Booking } from '../../types';
import { useToast } from '../../components/common/Toast';
import { Badge } from '../../components/common/Badge';
import {
  CheckCircle2,
  AlertCircle,
  Building,
  Clock,
  Calendar,
  GraduationCap,
  Users,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  BookmarkCheck,
  FileCheck
} from 'lucide-react';

export const BookingConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [draft, setDraft] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('svec_booking_draft');
    if (!saved) {
      navigate('/book-lab');
      return;
    }
    setDraft(JSON.parse(saved));
  }, [navigate]);

  if (!draft) return null;

  const handleConfirmBooking = async () => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await api.createBooking({
        date: draft.date,
        lab_id: draft.lab_id,
        slot_id: draft.slot_id,
        faculty_id: draft.faculty_id,
        department_id: draft.department_id,
        year_id: draft.year_id,
        batch_id: draft.batch_id,
        subject_id: draft.subject_id,
        subject_code: draft.subject_code,
        expected_students: draft.expected_students,
        remarks: draft.remarks,
      });

      if (res.success && res.booking) {
        setConfirmedBooking(res.booking);
        sessionStorage.removeItem('svec_booking_draft');
        toast.success('Laboratory booking confirmed successfully!');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete booking.');
      toast.error(err.message || 'Booking conflict encountered.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION STATE (Section 24)
  if (confirmedBooking) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Reservation Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Laboratory Booked Successfully!
            </h1>
            <p className="text-xs text-slate-500">
              System Reference ID:{' '}
              <span className="font-mono font-bold text-blue-700 text-sm">{confirmedBooking.booking_id}</span>
            </p>
          </div>

          {/* Booking Summary Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Laboratory</span>
                <span className="font-bold text-sm text-slate-900">{confirmedBooking.lab_name}</span>
                <span className="text-slate-500 block text-[11px]">{confirmedBooking.building_block}</span>
              </div>
              <Badge variant="booked" size="md" label="Confirmed" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Date & Period</span>
                <span className="font-bold text-slate-800">{confirmedBooking.date}</span>
                <span className="text-slate-500 block">{confirmedBooking.period} ({confirmedBooking.start_time} – {confirmedBooking.end_time})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Faculty</span>
                <span className="font-bold text-slate-800">{confirmedBooking.faculty_name}</span>
                <span className="text-slate-500 block">{confirmedBooking.department_code}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Course / Subject</span>
                <span className="font-bold text-slate-800">{confirmedBooking.subject_name}</span>
                <span className="text-slate-500 block font-mono text-[11px]">{confirmedBooking.subject_code}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Batch & Students</span>
                <span className="font-bold text-slate-800">{confirmedBooking.year_name} • {confirmedBooking.section_name}</span>
                <span className="text-slate-500 block">Expected: {confirmedBooking.expected_students || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/my-bookings')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>View My Bookings</span>
            </button>
            <button
              onClick={() => navigate('/lab-schedule')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>View Lab Schedule</span>
            </button>
            <button
              onClick={() => navigate('/book-lab')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Book Another Lab</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PRE-COMMIT REVIEW STATE (Section 23)
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Review Booking Details</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Please carefully review the reservation parameters before final commitment.
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back / Edit</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-700 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Booking Conflict</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Review Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Facility</span>
            <h2 className="text-lg font-extrabold text-slate-900">{draft.lab_name}</h2>
            <p className="text-xs text-slate-500">{draft.building_block} • Department: {draft.department_name}</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
              Capacity: {draft.capacity} Students
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Date & Operating Period</span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">{draft.date}</p>
              <p className="text-xs text-slate-600 font-semibold">
                {draft.period}: {draft.start_time} – {draft.end_time}
              </p>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Faculty Assigned</span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">{draft.faculty_name}</p>
              <p className="text-xs text-slate-600">{draft.department_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Course & Subject</span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">{draft.subject_name}</p>
              <p className="text-xs font-mono text-blue-700 font-semibold">Code: {draft.subject_code}</p>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>Target Batch</span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">{draft.year_name} • {draft.section_name}</p>
              <p className="text-xs text-slate-600">Expected: {draft.expected_students || 'Not specified'} students</p>
            </div>
          </div>

          {draft.remarks && (
            <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-700 border border-slate-100">
              <span className="font-bold text-slate-900">Session Remarks: </span>
              <span>{draft.remarks}</span>
            </div>
          )}

          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Database Double-Booking Guard active: This transaction commits atomically.</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            Back / Edit
          </button>

          <button
            type="button"
            onClick={handleConfirmBooking}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-blue-500/25 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Committing Transaction...</span>
              </>
            ) : (
              <>
                <span>Confirm Booking</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
