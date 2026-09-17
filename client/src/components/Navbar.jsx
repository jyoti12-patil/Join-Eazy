import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import {
  LogOut,
  ChevronDown,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';

export const Navbar = ({ toggleMobileSidebar }) => {
  const { user, isStudent, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              onClick={toggleMobileSidebar}
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors"
              aria-label="Open sidebar menu"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors focus:outline-none cursor-pointer group"
                title="Account menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-transparent group-hover:ring-brand-200 dark:group-hover:ring-brand-800 transition-all">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {user?.name}
                  </div>
                  <div className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                    {isAdmin ? 'Professor' : user?.studentId || 'Student'}
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                    profileDropdownOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : 'group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}
                />
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-30 animate-scaleUp">
                    {/* User Details Header */}
                    <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {user?.name || 'User'}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                            {user?.email || ''}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                            isAdmin
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50'
                              : 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/50'
                          }`}
                        >
                          {isAdmin
                            ? '🛡️ Professor (Admin)'
                            : `🎓 Student${user?.studentId ? ` • ${user.studentId}` : ''}`}
                        </span>
                      </div>
                    </div>

                    {/* Dark / Light Mode Toggle */}
                    <button
                      onClick={toggleTheme}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-center justify-between transition-colors cursor-pointer group mb-1"
                    >
                      <div className="flex items-center gap-2.5">
                        {isDark ? (
                          <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
                        ) : (
                          <Moon className="w-4 h-4 text-indigo-600 transition-transform group-hover:-rotate-12" />
                        )}
                        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                      </div>
                      <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${isDark ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                        <div data-theme-preserve className={`w-3.5 h-3.5 rounded-full !bg-white shadow-xs transition-transform duration-200 ${isDark ? 'translate-x-3.5' : 'translate-x-0'}`} />
                      </div>
                    </button>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors group cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

