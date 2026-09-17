import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ProgressBar } from '../../components/ProgressBar';
import { Badge } from '../../components/Badge';
import { ConfirmSubmissionModal } from '../../components/ConfirmSubmissionModal';
import {
  Users,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  FileCheck,
  Award,
  Sparkles,
  Calendar,
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [groupData, setGroupData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [groupRes, asgRes, progressRes] = await Promise.all([
        api.getMyGroup(user.id),
        api.getAssignments(user),
        api.getMyGroupSubmissions(user.id),
      ]);

      setGroupData(groupRes);
      setAssignments(asgRes || []);
      setProgress(progressRes?.stats || { total: 0, completed: 0, percentage: 0 });
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const group = groupData?.group;
  const pendingAssignments = assignments.filter((a) => a.submissionStatus !== 'CONFIRMED');

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Student Collaboration Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-brand-100 max-w-xl">
            Manage your project team, access OneDrive submission repositories, and track your group's assignment deadlines.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Group Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>My Group</span>
            <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white truncate">
            {group ? group.name : 'No Group'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {group ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {group.members.length} / {group.maxMembers} Members
              </span>
            ) : (
              <Link to="/student/groups" className="text-brand-600 dark:text-brand-400 hover:underline font-bold">
                Create or join a group →
              </Link>
            )}
          </div>
        </div>

        {/* Card 2: Assignments Pending */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Pending Submissions</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {pendingAssignments.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            out of {assignments.length} total assigned
          </div>
        </div>

        {/* Card 3: Completed Submissions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Confirmed Work</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {progress.completed}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            verified on OneDrive
          </div>
        </div>

        {/* Card 4: Progress Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Completion Rate</span>
            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {progress.percentage}%
          </div>
          <div className="mt-2">
            <ProgressBar percentage={progress.percentage} showLabel={false} height="h-2" />
          </div>
        </div>
      </div>

      {/* Main Grid: Pending Action & Group Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Next Action Assignment */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Active Coursework Feed
            </h2>
            <Link
              to="/student/assignments"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1"
            >
              <span>View all ({assignments.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {assignments.slice(0, 3).map((a) => {
              const isConfirmed = a.submissionStatus === 'CONFIRMED';
              const dueDateFormatted = new Date(a.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={a.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-300 dark:hover:border-brand-700 transition-all"
                >
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <Badge status={a.submissionStatus} size="xs" />
                      <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                        Due {dueDateFormatted}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{a.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {a.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={a.onedriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Open OneDrive link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">OneDrive</span>
                    </a>

                    {!isConfirmed ? (
                      <button
                        onClick={() => {
                          setSelectedAssignment(a);
                          setConfirmModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Confirm</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60">
                        Submitted ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Group Teammates Snapshot */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Team Snapshot</h2>
            <Link
              to="/student/groups"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4 transition-colors">
            {group ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {group.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Code: {group.code}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {group.members.length}/{group.maxMembers}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between text-xs py-1"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px]">
                          {m.user.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {m.user.name}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/student/groups"
                  className="w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors block text-center"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Invite Teammates</span>
                </Link>
              </>
            ) : (
              <div className="text-center py-6 space-y-3">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  You haven't formed or joined a group yet.
                </div>
                <Link
                  to="/student/groups"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create a Group</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmSubmissionModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        assignment={selectedAssignment}
        group={group}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};
