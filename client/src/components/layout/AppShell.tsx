import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ChevronRight, Home } from 'lucide-react';

export const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Generate dynamic breadcrumb items
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    return { url, label };
  });

  return (
    <div className="min-h-screen bg-slate-50/60 flex text-slate-800">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="px-4 md:px-8 pt-4 flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
            <Link to="/dashboard" className="flex items-center gap-1 text-slate-400 hover:text-blue-600 transition">
              <Home className="w-3.5 h-3.5" />
            </Link>
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.url}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  {isLast ? (
                    <span className="font-semibold text-slate-800">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.url} className="hover:text-blue-600 transition">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        {/* Content Outlet */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Institutional Footer */}
        <footer className="mt-auto border-t border-slate-200 bg-white py-5 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">SVEC Lab Scheduler</span>
              <span>•</span>
              <span>Sri Vasavi Engineering College</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Pedatadepalli, Tadepalligudem</span>
              <span>•</span>
              <span>Operating Hours: 9:30 AM – 4:30 PM (P1–P7)</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
