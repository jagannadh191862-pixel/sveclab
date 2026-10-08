import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Lab,
  TimeSlot,
  Department,
  Year,
  BatchSection,
  Subject,
  Faculty
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';
import {
  Calendar,
  Building,
  Clock,
  GraduationCap,
  Users,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Coffee,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const BookLab: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const queryDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const queryLabId = searchParams.get('labId') ? Number(searchParams.get('labId')) : '';
  const querySlotId = searchParams.get('slotId') ? Number(searchParams.get('slotId')) : '';

  // Form State
  const [selectedDate, setSelectedDate] = useState<string>(queryDate);
  const [selectedLabId, setSelectedLabId] = useState<number | ''>(queryLabId);
  const [selectedSlotId, setSelectedSlotId] = useState<number | ''>(querySlotId);
  const [departmentId, setDepartmentId] = useState<number | ''>(user?.departmentId || '');
  const [facultyId, setFacultyId] = useState<number | ''>('');
  const [yearId, setYearId] = useState<number | ''>('');
  const [batchId, setBatchId] = useState<number | ''>('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [subjectCode, setSubjectCode] = useState<string>('');
  const [expectedStudents, setExpectedStudents] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Master Data State
  const [labs, setLabs] = useState<Lab[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [batches, setBatches] = useState<BatchSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [bookedSlotIds, setBookedSlotIds] = useState<number[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>('');

  // Initial Load Masters
  useEffect(() => {
    const loadMasters = async () => {
      try {
        setLoading(true);
        const [labsRes, slotsRes, deptsRes, yearsRes] = await Promise.all([
          api.getLabs({ status: 'active' }),
          api.getTimeSlots(),
          api.getDepartments(),
          api.getYears(),
        ]);

        if (labsRes.success) setLabs(labsRes.labs);
        if (slotsRes.success) setTimeSlots(slotsRes.slots);
        if (deptsRes.success) {
          setDepartments(deptsRes.departments);
          if (!departmentId && deptsRes.departments.length > 0) {
            setDepartmentId(deptsRes.departments[0].id);
          }
        }
        if (yearsRes.success) {
          setYears(yearsRes.years);
          if (yearsRes.years.length > 0) setYearId(yearsRes.years[0].id);
        }
      } catch (err: any) {
        toast.error('Failed to load form master data.');
      } finally {
        setLoading(false);
      }
    };
    loadMasters();
  }, []);

  // Cascading Load: Faculty & Subjects when Department changes
  useEffect(() => {
    if (departmentId) {
      api.getFaculty({ department_id: Number(departmentId) }).then(res => {
        if (res.success) {
          setFacultyList(res.faculty);
          if (res.faculty.length > 0) setFacultyId(res.faculty[0].id);
        }
      });

      api.getSubjects({ department_id: Number(departmentId) }).then(res => {
        if (res.success) {
          setSubjects(res.subjects);
          if (res.subjects.length > 0) {
            setSubjectId(res.subjects[0].id);
            setSubjectCode(res.subjects[0].code);
          }
        }
      });
    }
  }, [departmentId]);

  // Cascading Load: Batches when Department or Year changes
  useEffect(() => {
    if (departmentId && yearId) {
      api.getBatches({ department_id: Number(departmentId), year_id: Number(yearId) }).then(res => {
        if (res.success) {
          setBatches(res.batches);
          if (res.batches.length > 0) setBatchId(res.batches[0].id);
        }
      });
    }
  }, [departmentId, yearId]);

  // Auto-fill Subject Code when Subject changes
  const handleSubjectChange = (subId: number) => {
    setSubjectId(subId);
    const sub = subjects.find(s => s.id === subId);
    if (sub) {
      setSubjectCode(sub.code);
    }
  };

  // Check Availability for selected Date and Lab
  useEffect(() => {
    if (selectedDate && selectedLabId) {
      api.getSchedule({ date: selectedDate, lab_id: Number(selectedLabId) }).then(res => {
        if (res.success && res.grid.length > 0) {
          const booked = res.grid[0].slots
            .filter(s => s.status === 'BOOKED')
            .map(s => s.slotId);
          setBookedSlotIds(booked);
        }
      });
    }
  }, [selectedDate, selectedLabId]);

  const selectedLab = labs.find(l => l.id === selectedLabId);
  const selectedSlot = timeSlots.find(s => s.id === selectedSlotId);
  const todayStr = new Date().toISOString().split('T')[0];

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!selectedDate) {
      setFormError('Please select a booking date.');
      return;
    }
    if (!isAdmin && selectedDate < todayStr) {
      setFormError('Cannot book laboratory slots for past dates.');
      return;
    }
    if (!selectedLabId) {
      setFormError('Please select a laboratory.');
      return;
    }
    if (!selectedSlotId) {
      setFormError('Please select a time period.');
      return;
    }
    if (bookedSlotIds.includes(Number(selectedSlotId))) {
      setFormError('The selected period is already booked for this laboratory. Please select another slot.');
      return;
    }
    if (!departmentId || !facultyId || !yearId || !batchId || !subjectId) {
      setFormError('Please complete all academic session details.');
      return;
    }

    // Capacity validation
    if (expectedStudents && selectedLab) {
      const count = parseInt(expectedStudents, 10);
      if (count > selectedLab.capacity) {
        setFormError(`Expected students count (${count}) exceeds laboratory capacity (${selectedLab.capacity}).`);
        return;
      }
    }

    // Package review data and navigate to review confirmation screen
    const bookingDraft = {
      date: selectedDate,
      lab_id: Number(selectedLabId),
      slot_id: Number(selectedSlotId),
      faculty_id: Number(facultyId),
      department_id: Number(departmentId),
      year_id: Number(yearId),
      batch_id: Number(batchId),
      subject_id: Number(subjectId),
      subject_code: subjectCode,
      expected_students: expectedStudents ? parseInt(expectedStudents, 10) : null,
      remarks,
      // Metadata for display
      lab_name: selectedLab?.lab_name,
      capacity: selectedLab?.capacity,
      building_block: selectedLab?.building_block,
      period: selectedSlot?.period,
      start_time: selectedSlot?.start_time,
      end_time: selectedSlot?.end_time,
      faculty_name: facultyList.find(f => f.id === facultyId)?.name,
      department_name: departments.find(d => d.id === departmentId)?.name,
      year_name: years.find(y => y.id === yearId)?.year_name,
      section_name: batches.find(b => b.id === batchId)?.section_name,
      subject_name: subjects.find(s => s.id === subjectId)?.name,
    };

    sessionStorage.setItem('svec_booking_draft', JSON.stringify(bookingDraft));
    navigate('/booking-confirmation');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Laboratory Session Reservation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Follow the 4-step workflow to verify availability and lock in your session.
          </p>
        </div>
        <button
          onClick={() => navigate('/lab-schedule')}
          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Schedule</span>
        </button>
      </div>

      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-700 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleProceedToReview} className="space-y-6">
        {/* STEP 1: DATE SELECTION */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-bold text-slate-900">Select Date</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Reservation Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  required
                  min={isAdmin ? undefined : todayStr}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center gap-2.5 text-xs text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Normal users can reserve current and future dates. Break is automatically excluded.</span>
            </div>
          </div>
        </div>

        {/* STEP 2: LABORATORY SELECTION */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm font-bold text-slate-900">Select Laboratory (29 Official College Labs)</h2>
            </div>
            {selectedLab && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Capacity: {selectedLab.capacity} Students
              </span>
            )}
          </div>

          <div className="pt-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Laboratory / Seminar Hall
            </label>
            <select
              required
              value={selectedLabId}
              onChange={e => setSelectedLabId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Laboratory from Inventory --</option>
              {labs.map(lab => (
                <option key={lab.id} value={lab.id}>
                  {lab.lab_name} ({lab.department}) • Capacity: {lab.capacity} • {lab.building_block}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* STEP 3: TIME PERIOD SELECTION */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h2 className="text-sm font-bold text-slate-900">Select Operating Period (P1–P7)</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {timeSlots.map(slot => {
              const isBreak = !slot.bookable;
              const isBooked = bookedSlotIds.includes(slot.id);
              const isSelected = selectedSlotId === slot.id;

              if (isBreak) {
                return (
                  <div
                    key={slot.id}
                    className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 flex flex-col justify-center items-center text-center opacity-70 cursor-not-allowed"
                  >
                    <Coffee className="w-4 h-4 text-amber-700 mb-1" />
                    <span className="font-bold text-xs">BREAK</span>
                    <span className="text-[10px] text-amber-800">1:00 PM – 2:00 PM</span>
                    <span className="text-[9px] uppercase tracking-wider text-amber-700 mt-1 font-semibold">Non-Bookable</span>
                  </div>
                );
              }

              if (isBooked) {
                return (
                  <div
                    key={slot.id}
                    className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col justify-center items-center text-center opacity-80 cursor-not-allowed"
                  >
                    <Clock className="w-4 h-4 text-rose-600 mb-1" />
                    <span className="font-bold text-xs">{slot.period}</span>
                    <span className="text-[10px] text-rose-700">{slot.start_time} – {slot.end_time}</span>
                    <span className="text-[10px] font-bold text-rose-600 mt-1">Already Booked</span>
                  </div>
                );
              }

              return (
                <button
                  type="button"
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col justify-center items-center cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white hover:bg-emerald-50/60 border-slate-200 hover:border-emerald-400 text-slate-800'
                  }`}
                >
                  <Clock className={`w-4 h-4 mb-1 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                  <span className="font-bold text-xs">{slot.period}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {slot.start_time} – {slot.end_time}
                  </span>
                  <span className={`text-[10px] font-semibold mt-1 ${isSelected ? 'text-blue-200' : 'text-emerald-600'}`}>
                    Available
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 4: ACADEMIC SESSION INFORMATION */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              4
            </span>
            <h2 className="text-sm font-bold text-slate-900">Academic Session Details (Mandatory)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Department
              </label>
              <select
                required
                value={departmentId}
                onChange={e => setDepartmentId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Assigned Faculty Member
              </label>
              <select
                required
                value={facultyId}
                onChange={e => setFacultyId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Faculty --</option>
                {facultyList.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.designation || 'Faculty'})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Academic Year
              </label>
              <select
                required
                value={yearId}
                onChange={e => setYearId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              >
                {years.map(y => (
                  <option key={y.id} value={y.id}>{y.year_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Batch / Section
              </label>
              <select
                required
                value={batchId}
                onChange={e => setBatchId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Section --</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.section_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Subject / Practical Course
              </label>
              <select
                required
                value={subjectId}
                onChange={e => handleSubjectChange(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Subject Code
              </label>
              <input
                type="text"
                readOnly
                value={subjectCode}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 bg-slate-50 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Expected Student Count (Validated against lab capacity: {selectedLab?.capacity || '--'})
              </label>
              <input
                type="number"
                min="1"
                max={selectedLab?.capacity || 200}
                value={expectedStudents}
                onChange={e => setExpectedStudents(e.target.value)}
                placeholder={`Max ${selectedLab?.capacity || 'Capacity'}`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Remarks (Optional)
              </label>
              <input
                type="text"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="e.g. Regular Lab Practical, Mid-term Evaluation"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <span>Review & Confirm Booking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
