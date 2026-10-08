import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  BookmarkCheck,
  User,
  LogOut,
  Building,
  Users,
  Layers,
  GraduationCap,
  UsersRound,
  BookOpen,
  UserCheck,
  Clock,
  BarChart3,
  ShieldAlert,
  Settings,
  X,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userNavItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Lab Schedule', to: '/lab-schedule', icon: CalendarDays },
    { label: 'Book Lab', to: '/book-lab', icon: PlusCircle },
    { label: 'My Bookings', to: '/my-bookings', icon: BookmarkCheck },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  const adminNavItems = [
    { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Live Schedule', to: '/admin/schedule', icon: CalendarDays },
    { label: 'All Bookings', to: '/admin/bookings', icon: BookmarkCheck },
    { label: 'Laboratories (29)', to: '/admin/labs', icon: Building },
    { label: 'User Directory', to: '/admin/users', icon: Users },
  ];

  const adminMasterItems = [
    { label: 'Departments', to: '/admin/departments', icon: Layers },
    { label: 'Academic Years', to: '/admin/years', icon: GraduationCap },
    { label: 'Batches & Sections', to: '/admin/batches', icon: UsersRound },
    { label: 'Subjects / Courses', to: '/admin/subjects', icon: BookOpen },
    { label: 'Faculty Directory', to: '/admin/faculty', icon: UserCheck },
    { label: 'Time Slots (P1–P7)', to: '/admin/time-slots', icon: Clock },
  ];

  const adminSystemItems = [
    { label: 'Analytics & Reports', to: '/admin/reports', icon: BarChart3 },
    { label: 'Audit Trail', to: '/admin/audit-logs', icon: ShieldAlert },
    { label: 'System Settings', to: '/admin/settings', icon: Settings },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              SVEC
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
                Lab Scheduler
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">v2.0 Production</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {!isAdmin ? (
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Faculty Portal
              </p>
              <nav className="space-y-1">
                {userNavItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => onClose()}
                      className={navLinkClass}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ) : (
            <>
              {/* Admin Core */}
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Administration
                </p>
                <nav className="space-y-1">
                  {adminNavItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => onClose()}
                        className={navLinkClass}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              {/* Master Data */}
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Master Data
                </p>
                <nav className="space-y-1">
                  {adminMasterItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => onClose()}
                        className={navLinkClass}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              {/* Reports & System */}
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Audit & Reports
                </p>
                <nav className="space-y-1">
                  {adminSystemItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => onClose()}
                        className={navLinkClass}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              {/* Switch to Faculty Portal view */}
              <div className="pt-2 border-t border-slate-100">
                <NavLink
                  to="/dashboard"
                  onClick={() => onClose()}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Faculty Dashboard</span>
                </NavLink>
              </div>
            </>
          )}
        </div>

        {/* Footer / User Info */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {user?.role === 'administrator' ? 'Administrator' : 'Faculty'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
