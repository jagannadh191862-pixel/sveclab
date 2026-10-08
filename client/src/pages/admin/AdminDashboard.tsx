import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../components/common/Toast';
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  Percent,
  Clock,
  XCircle,
  Users,
  ShieldCheck,
  BarChart3,
  Layers,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [deptStats, setDeptStats] = useState<any[]>([]);
  const [utilizationList, setUtilizationList] = useState<any[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      try {
        setLoading(true);
        const [schedRes, bookingsRes, deptRes, utilRes] = await Promise.all([
          api.getSchedule({ date: todayStr }),
          api.getAllBookings({ limit: 1 }),
          api.getDepartmentUsageReport({ startDate: todayStr, endDate: todayStr }),
          api.getLabUtilizationReport({ startDate: todayStr, endDate: todayStr }),
        ]);

        if (schedRes.success) {
          setStats({
            totalLabs: schedRes.stats.totalLabs,
            todayBookings: schedRes.stats.bookedSlots,
            todayAvailable: schedRes.stats.availableSlots,
            todayUtilization: schedRes.stats.utilizationPercentage,
            totalBookingsCount: bookingsRes.total || 0,
          });
        }
        if (deptRes.success) {
          setDeptStats(deptRes.records || []);
        }
        if (utilRes.success) {
          setUtilizationList(utilRes.records || []);
        }
      } catch (err: any) {
        toast.error('Failed to load admin analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sri Vasavi Engineering College • Administrator Control Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Institutional Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time management, double-booking surveillance, utilization tracking, and master configurations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/admin/schedule')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Live Schedule Matrix</span>
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2 border border-white/15 transition cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Generate Reports</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <LoadingSkeleton rows={1} height="h-28" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Active Labs"
            value={stats?.totalLabs || 29}
            subtitle="Excel Seed Data Loaded"
            icon={Building2}
            color="blue"
          />
          <StatCard
            title="Today's Bookings"
            value={stats?.todayBookings || 0}
            subtitle={`${stats?.todayAvailable || 0} slots remaining today`}
            icon={CalendarCheck}
            color="emerald"
          />
          <StatCard
            title="Lab Utilization Rate"
            value={`${stats?.todayUtilization || 0}%`}
            subtitle="Calculated on 7 bookable periods"
            icon={Percent}
            color="indigo"
          />
          <StatCard
            title="Cumulative Bookings"
            value={stats?.totalBookingsCount || 0}
            subtitle="Total records in database"
            icon={TrendingUp}
            color="amber"
          />
        </div>
      )}

      {/* Quick Admin Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Live Schedule', to: '/admin/schedule', icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
          { label: 'All Bookings', to: '/admin/bookings', icon: CalendarCheck, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Lab Master (29)', to: '/admin/labs', icon: Building2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'User Directory', to: '/admin/users', icon: Users, color: 'text-violet-600 bg-violet-50' },
          { label: 'Analytics Reports', to: '/admin/reports', icon: BarChart3, color: 'text-amber-600 bg-amber-50' },
          { label: 'Audit Trail', to: '/admin/audit-logs', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => navigate(item.to)}
              className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition text-left flex flex-col justify-between cursor-pointer group"
            >
              <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center mb-3 group-hover:scale-105 transition`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{item.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Analytics Breakdown: Department Usage & Top Utilized Labs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Usage Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Department Activity Overview</h2>
              <p className="text-xs text-slate-500">Active sessions across academic departments</p>
            </div>
            <button
              onClick={() => navigate('/admin/reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Full Report →
            </button>
          </div>

          {loading ? (
            <LoadingSkeleton rows={4} height="h-12" />
          ) : deptStats.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-500">
              No department bookings recorded for today yet.
            </div>
          ) : (
            <div className="space-y-3">
              {deptStats.slice(0, 6).map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{d.department_code}</span>
                    <span className="text-slate-500 font-semibold">{d.active_bookings} Active Sessions</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (d.active_bookings / (stats?.todayBookings || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* High Capacity Facilities */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Key Laboratories & Seminar Halls</h2>
              <p className="text-xs text-slate-500">Capacities up to 144 students from Excel inventory</p>
            </div>
            <button
              onClick={() => navigate('/admin/labs')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View All 29 Labs →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {utilizationList.slice(0, 5).map((lab, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{lab.labName}</span>
                  <span className="text-slate-500">{lab.department}</span>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    Capacity: {lab.capacity}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                    {lab.bookedPeriods} / {lab.totalPeriods} slots booked
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
