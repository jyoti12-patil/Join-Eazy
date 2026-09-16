import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Users,
  BookOpen,
  CheckSquare,
  BarChart3,
  LogOut,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isStudent, isAdmin, logout, switchDemoUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const handlePersonaSwitch = async (email, name) => {
    try {
      await switchDemoUser(email);
      setDropdownOpen(false);
      toast.success(`Switched account to: ${name}`);
      if (email.includes('professor')) {
        navigate('/professor');
      } else {
        navigate('/student');
      }
    } catch (err) {
      toast.error('Failed to switch persona');
    }
  };

  const studentLinks = [
    { label: 'Overview', to: '/student', icon: Layers },
    { label: 'My Group', to: '/student/groups', icon: Users },
    { label: 'Assignments', to: '/student/assignments', icon: BookOpen },
    { label: 'Group Progress', to: '/student/progress', icon: CheckSquare },
  ];

  const adminLinks = [
    { label: 'Dashboard & Analytics', to: '/professor', icon: BarChart3 },
    { label: 'Manage Assignments', to: '/professor/assignments', icon: BookOpen },
    { label: 'Submission Tracker', to: '/professor/submissions', icon: CheckSquare },
    { label: 'All Groups', to: '/professor/groups', icon: Users },
  ];

  const activeLinks = isStudent ? studentLinks : isAdmin ? adminLinks : [];

  return (
    <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link to={isAdmin ? '/professor' : '/student'} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    JoinEazy
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">
                    Edu
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Group & Assignment Hub
                </div>
              </div>
            </Link>

            {/* Navigation links */}
            <div className="hidden md:flex items-center gap-1">
              {activeLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                title="Quick switch account for testing"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Switch Persona</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-100 p-2 z-30 animate-scaleUp">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                      Select Demo Persona
                    </div>
                    <button
                      onClick={() => handlePersonaSwitch('professor@joineazy.edu', 'Dr. Evelyn Reed')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isAdmin ? 'bg-indigo-50/70 text-indigo-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          🎓 Dr. Evelyn Reed
                        </div>
                        <div className="text-[11px] text-slate-400">Professor (Admin)</div>
                      </div>
                      {isAdmin && <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded">Active</span>}
                    </button>

                    <button
                      onClick={() => handlePersonaSwitch('alex@joineazy.edu', 'Alex Chen')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        user?.email === 'alex@joineazy.edu' ? 'bg-indigo-50/70 text-indigo-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          🧑‍💻 Alex Chen
                        </div>
                        <div className="text-[11px] text-slate-400">Leader (Quantum Coders)</div>
                      </div>
                      {user?.email === 'alex@joineazy.edu' && <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded">Active</span>}
                    </button>

                    <button
                      onClick={() => handlePersonaSwitch('emily@joineazy.edu', 'Emily Zhang')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        user?.email === 'emily@joineazy.edu' ? 'bg-indigo-50/70 text-indigo-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          🌟 Emily Zhang
                        </div>
                        <div className="text-[11px] text-slate-400">Student (No group yet)</div>
                      </div>
                      {user?.email === 'emily@joineazy.edu' && <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded">Active</span>}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* User info and role chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.name}
                </div>
                <div className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider">
                  {isAdmin ? 'Professor' : user?.studentId || 'Student'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
