import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Building2,
  Calendar,
  Clock
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Left: Mobile hamburger & College branding title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-600 rounded-xl hover:bg-slate-100 focus:outline-hidden md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-tr from-blue-700 to-indigo-600 text-white font-bold text-sm shadow-md shadow-blue-500/20">
            SVEC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 tracking-tight leading-none hidden sm:inline">
                SRI VASAVI ENGINEERING COLLEGE
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 hidden md:inline">
                {isAdmin ? 'ADMIN CONSOLE' : 'FACULTY PORTAL'}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block mt-0.5">Laboratory Scheduling & Booking System</p>
          </div>
        </div>
      </div>

      {/* Right: Date pill & User Profile Menu */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>{todayStr}</span>
          <span className="text-slate-300">|</span>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>9:30 AM – 4:30 PM</span>
        </div>

        {/* User Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center border border-blue-200">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                {user?.name}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                {user?.employeeId}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{user?.departmentCode || 'Faculty'}</span>
                </div>
              </div>

              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </Link>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
