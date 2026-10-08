import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Department, Lab } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../components/common/Toast';
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Building2,
  Users,
  Percent,
  XCircle,
  Clock
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const toast = useToast();
  const todayStr = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<
    'daily' | 'date-range' | 'utilization' | 'faculty' | 'department' | 'cancelled'
  >('daily');

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [departmentId, setDepartmentId] = useState('ALL');
  const [labId, setLabId] = useState('ALL');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDepartments().then(res => {
      if (res.success) setDepartments(res.departments);
    });
    api.getLabs().then(res => {
      if (res.success) setLabs(res.labs);
    });
  }, []);

  const fetchCurrentReport = async () => {
    try {
      setLoading(true);
      if (activeTab === 'daily') {
        const res = await api.getDailyScheduleReport({
          date: startDate,
          department_id: departmentId !== 'ALL' ? departmentId : undefined,
          lab_id: labId !== 'ALL' ? labId : undefined,
        });
        setReportData(res);
      } else if (activeTab === 'date-range') {
        const res = await api.getDateRangeReport({
          startDate,
          endDate,
          department_id: departmentId !== 'ALL' ? departmentId : undefined,
          lab_id: labId !== 'ALL' ? labId : undefined,
        });
        setReportData(res);
      } else if (activeTab === 'utilization') {
        const res = await api.getLabUtilizationReport({
          startDate,
          endDate,
          department_id: departmentId !== 'ALL' ? departmentId : undefined,
        });
        setReportData(res);
      } else if (activeTab === 'faculty') {
        const res = await api.getFacultyUsageReport({
          startDate,
          endDate,
          department_id: departmentId !== 'ALL' ? departmentId : undefined,
        });
        setReportData(res);
      } else if (activeTab === 'department') {
        const res = await api.getDepartmentUsageReport({
          startDate,
          endDate,
        });
        setReportData(res);
      } else if (activeTab === 'cancelled') {
        const res = await api.getCancelledBookingsReport({
          startDate,
          endDate,
          department_id: departmentId !== 'ALL' ? departmentId : undefined,
          lab_id: labId !== 'ALL' ? labId : undefined,
        });
        setReportData(res);
      }
    } catch (err: any) {
      toast.error('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentReport();
  }, [activeTab, startDate, endDate, departmentId, labId]);

  const handleExport = (format: 'csv' | 'xlsx') => {
    const url = `/api/reports/export?format=${format}&type=${activeTab === 'utilization' ? 'utilization' : activeTab === 'daily' ? 'daily-schedule' : 'date-range'}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `svec_report_${activeTab}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
  };

  const tabs = [
    { id: 'daily', label: '1. Daily Lab Schedule', icon: Calendar },
    { id: 'date-range', label: '2. Date-Range Bookings', icon: FileText },
    { id: 'utilization', label: '3. Lab Utilization %', icon: Percent },
    { id: 'faculty', label: '4. Faculty Usage', icon: Users },
    { id: 'department', label: '5. Department Usage', icon: Building2 },
    { id: 'cancelled', label: '6. Cancelled Bookings', icon: XCircle },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Analytics & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real database audit records, utilization calculations, and institutional exports in CSV & Excel (.xlsx).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Parameters Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <label className="font-semibold text-slate-600">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
          />
        </div>

        {activeTab !== 'daily' && (
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-600">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>
        )}

        {['daily', 'date-range', 'utilization', 'faculty', 'cancelled'].includes(activeTab) && (
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-600">Department:</label>
            <select
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.code}</option>
              ))}
            </select>
          </div>
        )}

        {['daily', 'date-range', 'cancelled'].includes(activeTab) && (
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-600">Lab:</label>
            <select
              value={labId}
              onChange={e => setLabId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="ALL">All Labs</option>
              {labs.map(l => (
                <option key={l.id} value={l.id}>{l.lab_name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Reports Display Card */}
      {loading ? (
        <LoadingSkeleton rows={8} height="h-14" />
      ) : !reportData || (reportData.records && reportData.records.length === 0) ? (
        <EmptyState
          icon={BarChart3}
          title="No records found"
          description="There is no historical activity recorded for the selected parameters."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* TAB 1: DAILY LAB SCHEDULE */}
          {activeTab === 'daily' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Booking ID</th>
                    <th className="px-4 py-3.5">Laboratory</th>
                    <th className="px-4 py-3.5">Period & Time</th>
                    <th className="px-4 py-3.5">Faculty Assigned</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5">Batch</th>
                    <th className="px-4 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportData.records.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-700">{r.booking_id}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{r.lab_name}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">{r.period} ({r.start_time} – {r.end_time})</td>
                      <td className="px-4 py-3.5">{r.faculty_name}</td>
                      <td className="px-4 py-3.5 font-medium">{r.subject_name}</td>
                      <td className="px-4 py-3.5">{r.year_name} • {r.section_name}</td>
                      <td className="px-4 py-3.5"><Badge variant={r.status === 'BOOKED' ? 'booked' : 'cancelled'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: DATE RANGE REPORT */}
          {activeTab === 'date-range' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Booking ID</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Laboratory</th>
                    <th className="px-4 py-3.5">Period</th>
                    <th className="px-4 py-3.5">Faculty</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportData.records.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-700">{r.booking_id}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{r.date}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{r.lab_name}</td>
                      <td className="px-4 py-3.5">{r.period}</td>
                      <td className="px-4 py-3.5">{r.faculty_name}</td>
                      <td className="px-4 py-3.5">{r.subject_name}</td>
                      <td className="px-4 py-3.5"><Badge variant={r.status === 'BOOKED' ? 'booked' : 'cancelled'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: LAB UTILIZATION (SECTION 34 FORMULA) */}
          {activeTab === 'utilization' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Laboratory Name</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Capacity</th>
                    <th className="px-4 py-3.5">Total Bookable Periods</th>
                    <th className="px-4 py-3.5">Booked Periods</th>
                    <th className="px-4 py-3.5">Available Periods</th>
                    <th className="px-5 py-3.5 text-right">Utilization %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportData.records.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{r.labName}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-600">{r.department}</td>
                      <td className="px-4 py-3.5 font-mono">{r.capacity} students</td>
                      <td className="px-4 py-3.5">{r.totalPeriods}</td>
                      <td className="px-4 py-3.5 font-bold text-blue-700">{r.bookedPeriods}</td>
                      <td className="px-4 py-3.5 text-emerald-700 font-semibold">{r.availablePeriods}</td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-sm text-slate-900">
                        <span className={`px-2.5 py-0.5 rounded-full ${
                          r.utilizationPercentage > 50 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {r.utilizationPercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: FACULTY USAGE */}
          {activeTab === 'faculty' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Faculty Member</th>
                    <th className="px-4 py-3.5">Designation</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Completed Sessions</th>
                    <th className="px-4 py-3.5">Cancelled Sessions</th>
                    <th className="px-5 py-3.5 text-right">Total Requests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportData.records.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{r.faculty_name}</td>
                      <td className="px-4 py-3.5 text-slate-600">{r.designation}</td>
                      <td className="px-4 py-3.5 font-semibold text-blue-700">{r.department_code}</td>
                      <td className="px-4 py-3.5 font-bold text-emerald-700">{r.completed_sessions}</td>
                      <td className="px-4 py-3.5 font-semibold text-rose-600">{r.cancelled_sessions}</td>
                      <td className="px-5 py-3.5 text-right font-bold">{r.total_bookings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: DEPARTMENT USAGE */}
          {activeTab === 'department' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Department Code</th>
                    <th className="px-4 py-3.5">Department Name</th>
                    <th className="px-4 py-3.5">Active Lab Bookings</th>
                    <th className="px-4 py-3.5">Cancelled Bookings</th>
                    <th className="px-5 py-3.5 text-right">Total Bookings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportData.records.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-700">{r.department_code}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{r.department_name}</td>
                      <td className="px-4 py-3.5 font-bold text-emerald-700">{r.active_bookings}</td>
                      <td className="px-4 py-3.5 font-semibold text-rose-600">{r.cancelled_bookings}</td>
                      <td className="px-5 py-3.5 text-right font-bold">{r.total_requests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: CANCELLED BOOKINGS */}
          {activeTab === 'cancelled' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Booking ID</th>
                    <th className="px-4 py-3.5">Date & Slot</th>
                    <th className="px-4 py-3.5">Laboratory</th>
                    <th className="px-4 py-3.5">Faculty</th>
                    <th className="px-4 py-3.5">Cancellation Reason</th>
                    <th className="px-4 py-3.5">Cancelled By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportData.records.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-700">{r.booking_id}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{r.date} ({r.period})</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{r.lab_name}</td>
                      <td className="px-4 py-3.5">{r.faculty_name}</td>
                      <td className="px-4 py-3.5 text-rose-800 font-medium">{r.cancellation_reason || 'N/A'}</td>
                      <td className="px-4 py-3.5 text-slate-500">{r.cancelled_by_name || 'System/User'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
