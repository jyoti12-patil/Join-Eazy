import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  BookOpen,
  CheckSquare,
  Users,
  Layers,
  GraduationCap,
  X,
} from 'lucide-react';

export const Sidebar = ({ isCollapsed, toggleCollapse, mobileOpen, closeMobile }) => {
  const { user, isStudent, isAdmin } = useAuth();
  const location = useLocation();

  const studentLinks = [
    { label: 'Overview', to: '/student', icon: Layers },
    { label: 'Assignments', to: '/student/assignments', icon: BookOpen },
    { label: 'My Group', to: '/student/groups', icon: Users },
    { label: 'Group Progress', to: '/student/progress', icon: CheckSquare },
  ];

  const adminLinks = [
    { label: 'Dashboard & Analytics', to: '/professor', icon: BarChart3 },
    { label: 'Course Management', to: '/professor/courses', icon: GraduationCap },
    { label: 'Manage Assignments', to: '/professor/assignments', icon: BookOpen },
    { label: 'Submission Tracker', to: '/professor/submissions', icon: CheckSquare },
    { label: 'All Groups', to: '/professor/groups', icon: Users },
  ];

  const navItems = isAdmin ? adminLinks : isStudent ? studentLinks : [];

  const handleLogoToggle = (e) => {
    e.preventDefault();
    if (mobileOpen) {
      closeMobile();
    } else {
      toggleCollapse();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-50 md:z-30 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out select-none shadow-sm md:shadow-none overflow-x-hidden ${
          // Mobile responsive slide-in
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        } ${
          // Desktop collapsed vs expanded width
          isCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {/* Top Header / Branding */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleLogoToggle}
              className={`flex items-center gap-2.5 overflow-hidden transition-all text-left cursor-pointer focus:outline-none select-none ${
                isCollapsed ? 'md:justify-center md:w-full' : ''
              }`}
              title={isCollapsed ? 'Click logo to expand sidebar' : 'Click logo to collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:scale-105 group-hover:shadow-brand-500/40 active:scale-95 transition-all">
                <Users className="w-5 h-5" />
              </div>
              <div
                className={`transition-opacity duration-200 ${
                  isCollapsed ? 'md:hidden' : 'block'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent group-hover:from-brand-600 group-hover:to-indigo-600 transition-colors">
                    JoinEazy
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 group-hover:bg-brand-200 dark:group-hover:bg-brand-900 transition-colors">
                    Edu
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 group-hover:text-brand-500 transition-colors">
                  <span>Group & Assignment Hub</span>
                </div>
              </div>
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={closeMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 py-3 space-y-1 overflow-x-hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <div key={item.to} className="relative">
                  <Link
                    to={item.to}
                    onClick={closeMobile}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isCollapsed ? 'md:justify-center md:px-2' : ''
                    } ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 shadow-xs ring-1 ring-brand-100/80 dark:ring-brand-800/50 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                      }`}
                    />
                    <span
                      className={`truncate transition-all duration-200 ${
                        isCollapsed ? 'md:hidden' : 'block'
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
