import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { ProgressBar } from '../../components/ProgressBar';
import { Badge } from '../../components/Badge';
import { StatusBadge } from '../../components/StatusBadge';
import { SkeletonDashboard } from '../../components/SkeletonLoader';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import {
  BarChart3, Users, BookOpen, CheckCircle2, TrendingUp, PlusCircle,
  ExternalLink, Clock, Sparkles, ArrowRight, GraduationCap, Layers,
} from 'lucide-react';

export const ProfessorDashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [analyticsRes, coursesRes] = await Promise.all([
          api.getAnalytics(),
          api.getCourses(user),
        ]);
        setAnalytics(analyticsRes);
        setCourses(coursesRes || []);
      } catch (err) {
        toast.error('Failed to load analytics dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <SkeletonDashboard />;

  const { summary = {}, groupPerformance = [], assignmentStats = [], courseStats = [], recentSubmissions = [] } = analytics || {};

  const assignmentChartData = assignmentStats.map((a) => ({
    name: a.title.length > 15 ? `${a.title.slice(0, 15)}...` : a.title,
    Submitted: a.submittedCount,
    Pending: a.pendingCount,
  }));

  const groupChartData = groupPerformance.map((g) => ({
    name: g.name.length > 12 ? `${g.name.slice(0, 12)}...` : g.name,
    Completed: g.completedCount,
    Pending: g.pendingCount,
  }));

  const statCards = [
    { label: 'Total Courses', value: summary.totalCourses || courses.length, icon: GraduationCap, color: 'from-violet-500 to-purple-600' },
    { label: 'Assignments', value: summary.totalAssignments, icon: BookOpen, color: 'from-brand-500 to-indigo-600' },
    { label: 'Groups', value: summary.totalGroups, icon: Users, color: 'from-cyan-500 to-blue-600' },
    { label: 'Students', value: summary.totalStudents, icon: TrendingUp, color: 'from-emerald-500 to-green-600' },
    { label: 'Submissions', value: summary.totalSubmissions, icon: CheckCircle2, color: 'from-amber-500 to-orange-600' },
    { label: 'Completion Rate', value: `${summary.overallRate || 0}%`, icon: BarChart3, color: 'from-pink-500 to-rose-600' },
  ];

  const chartColors = {
    submitted: isDark ? '#818cf8' : '#6366f1',
    pending: isDark ? '#475569' : '#cbd5e1',
  };

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Professor Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user.name}
            </h1>
            <p className="text-white/70 text-sm">
              Monitor your courses, track submissions, and manage assignments.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              to="/professor/assignments"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white rounded-xl text-xs font-bold transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              New Assignment
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`glass-card glass-card-hover p-4 space-y-2 animate-fade-in-up stagger-${i + 1}`}>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-white shadow-md`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Courses Section */}
      {courses.length > 0 && (
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-brand-500" />
              My Courses
            </h2>
            <Link to="/professor/courses" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
              Manage Courses →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course, i) => (
              <div key={course.id} className={`glass-card glass-card-hover p-5 space-y-3 animate-fade-in-up stagger-${i + 1}`}>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <Badge variant="brand">{course.code}</Badge>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{course.name}</h3>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 py-1.5">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{course._count?.enrollments || 0}</p>
                    <p className="text-[10px] text-slate-400">Students</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 py-1.5">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{course._count?.assignments || 0}</p>
                    <p className="text-[10px] text-slate-400">Assignments</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 py-1.5">
                    <p className="text-sm font-bold text-success-500">{course.completionRate || 0}%</p>
                    <p className="text-[10px] text-slate-400">Complete</p>
                  </div>
                </div>
                <ProgressBar value={course.completionRate || 0} max={100} size="sm" showPercentage={false} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Submissions Chart */}
        {assignmentChartData.length > 0 && (
          <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-500" />
              Submissions by Assignment
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assignmentChartData} barSize={20} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#f1f5f9' : '#0f172a' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Submitted" fill={chartColors.submitted} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pending" fill={chartColors.pending} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Group Performance Chart */}
        {groupChartData.length > 0 && (
          <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-500" />
              Group Performance
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupChartData} barSize={20} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#f1f5f9' : '#0f172a' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pending" fill={chartColors.pending} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity Feed */}
      {recentSubmissions.length > 0 && (
        <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Recent Submissions
          </h3>
          <div className="space-y-2">
            {recentSubmissions.map((sub, i) => (
              <div key={sub.id || i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors animate-fade-in-up stagger-${i + 1}`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-success-400 to-emerald-500 flex items-center justify-center text-white">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    {sub.submittedBy?.name || 'Student'} <span className="font-normal text-slate-400">submitted</span> {sub.assignment?.title}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {sub.group?.name && `${sub.group.name} · `}
                    {sub.confirmedAt && new Date(sub.confirmedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/professor/assignments', icon: BookOpen, label: 'Manage Assignments', color: 'from-brand-500 to-indigo-600' },
          { to: '/professor/submissions', icon: CheckCircle2, label: 'Submission Tracker', color: 'from-emerald-500 to-green-600' },
          { to: '/professor/groups', icon: Users, label: 'View All Groups', color: 'from-cyan-500 to-blue-600' },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.to} to={link.to} className="glass-card glass-card-hover p-4 flex items-center gap-3 group">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${link.color} flex items-center justify-center text-white shadow-md`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{link.label}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
