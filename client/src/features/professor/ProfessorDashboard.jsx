import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { ProgressBar } from '../../components/ProgressBar';
import { Badge } from '../../components/Badge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Users,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  ExternalLink,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const ProfessorDashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.getAnalytics();
        setAnalytics(res);
      } catch (err) {
        toast.error('Failed to load analytics dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const {
    summary = {},
    groupPerformance = [],
    assignmentStats = [],
    recentSubmissions = [],
  } = analytics || {};

  // Formatted data for Recharts
  const assignmentChartData = assignmentStats.map((a) => ({
    name: a.title.length > 15 ? `${a.title.slice(0, 15)}...` : a.title,
    Submitted: a.submittedCount,
    Pending: a.pendingCount,
  }));

  const groupChartData = groupPerformance.map((g) => ({
    name: g.name.length > 12 ? `${g.name.slice(0, 12)}...` : g.name,
    Completed: g.completedCount,
    Pending: g.pendingCount,
    rate: g.completionRate,
  }));

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-sm text-brand-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Professor Admin Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Cohort Analytics & Submission Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Welcome back, {user?.name}. Monitor student groups, review OneDrive submission confirmations, and measure class-wide performance.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/professor/assignments"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Assignment</span>
          </Link>
          <Link
            to="/professor/submissions"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Submission Log</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Assignments</span>
            <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {summary.totalAssignments || 0}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Coursework published</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Active Groups</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {summary.totalGroups || 0}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Formed by students</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {summary.totalStudents || 0}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">In this cohort</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Confirmed Work</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {summary.totalSubmissions || 0}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Verified on OneDrive</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-brand-600 dark:text-brand-400 font-mono">
            {summary.overallRate || 0}%
          </div>
          <div className="mt-2">
            <ProgressBar percentage={summary.overallRate || 0} showLabel={false} height="h-2" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Assignment Completion */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Assignment Completion Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submitted vs Pending groups per assignment
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assignmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderRadius: '12px',
                    border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                    fontSize: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Submitted" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Group Performance */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Group Performance Comparison
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Coursework completed by each student team
              </p>
            </div>
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderRadius: '12px',
                    border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                    fontSize: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pending" fill={isDark ? '#334155' : '#cbd5e1'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Submissions Feed & Group Standings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Group Performance List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Student Teams Progress Overview
            </h3>
            <Link
              to="/professor/submissions"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1"
            >
              <span>View full log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {groupPerformance.map((gp) => (
              <div key={gp.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {gp.name}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      ({gp.memberCount} members)
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Leader:{' '}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {gp.members.find((m) => m.role === 'LEADER')?.name || 'Student'}
                    </strong>
                  </div>
                </div>

                <div className="w-48 space-y-1 text-right">
                  <div className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                    {gp.completedCount} / {gp.assignedCount} Completed ({gp.completionRate}%)
                  </div>
                  <ProgressBar
                    percentage={gp.completionRate}
                    showLabel={false}
                    height="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Recent Submissions Activity Log */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Recent Verifications
          </h3>

          <div className="space-y-3">
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((sub) => {
                const confirmedTime = new Date(sub.confirmedAt).toLocaleDateString(
                  'en-US',
                  {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                );

                return (
                  <div
                    key={sub.id}
                    className="p-3 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {sub.group.name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {confirmedTime}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 font-medium truncate">
                      {sub.assignment.title}
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Verified by {sub.submittedBy.name}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
                No submissions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
