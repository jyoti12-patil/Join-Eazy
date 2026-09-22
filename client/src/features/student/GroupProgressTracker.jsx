import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ProgressBar } from '../../components/ProgressBar';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Trophy,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  Target,
  Sparkles,
  Users,
} from 'lucide-react';

export const GroupProgressTracker = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [data, setData] = useState({ submissions: [], stats: { total: 0, completed: 0, percentage: 0 } });
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      try {
        const [progressRes, myGroupRes] = await Promise.all([
          api.getMyGroupSubmissions(user.id),
          api.getMyGroup(user.id),
        ]);
        setData(progressRes);
        setGroupData(myGroupRes);
      } catch (err) {
        toast.error('Failed to load group progress');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProgress();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const { stats, submissions } = data;
  const group = groupData?.group;

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Group Progress & Completion Badges
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Visual milestone tracking for {group?.name || 'your group'}
        </p>
      </div>

      {/* Hero Progress Banner */}
      <div className="bg-gradient-to-br from-brand-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 text-brand-300 text-xs font-bold uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Overall Completion Status</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              {stats.percentage}% Completed
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {stats.completed} out of {stats.total} total coursework milestones confirmed by your team on OneDrive.
            </p>
            <div className="pt-2 max-w-md">
              <ProgressBar
                value={stats.completed}
                max={stats.total}
                showPercentage={false}
                size="lg"
              />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center min-w-[160px] self-start md:self-auto">
            <div className="text-3xl font-black font-mono text-emerald-400">
              {stats.completed}/{stats.total}
            </div>
            <div className="text-xs uppercase tracking-wider text-slate-300 font-bold mt-1">
              Confirmed
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Badges Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Team Achievement Badges
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Badges awarded based on timely confirmations and completion milestones
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Badge 1: Starter */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              stats.completed > 0
                ? 'bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-950/60 dark:to-slate-900 border-indigo-200/80 dark:border-indigo-800/60 shadow-xs'
                : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800 opacity-50'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">First Submission</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Confirmed your group's first assignment on OneDrive.
            </p>
            <div className="mt-3">
              {stats.completed > 0 ? (
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                  Unlocked ✓
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Locked</span>
              )}
            </div>
          </div>

          {/* Badge 2: Consistent */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              stats.percentage >= 50
                ? 'bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-950/60 dark:to-slate-900 border-blue-200/80 dark:border-blue-800/60 shadow-xs'
                : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800 opacity-50'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Halfway Milestone</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Achieved 50% or higher completion rate across assignments.
            </p>
            <div className="mt-3">
              {stats.percentage >= 50 ? (
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                  Unlocked ✓
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Locked ({stats.percentage}/50%)</span>
              )}
            </div>
          </div>

          {/* Badge 3: Master */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              stats.percentage === 100 && stats.total > 0
                ? 'bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/60 dark:to-slate-900 border-amber-200/80 dark:border-amber-800/60 shadow-xs'
                : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800 opacity-50'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-3">
              <Trophy className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">100% Perfection</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              All coursework submitted and verified with 0 overdue tasks.
            </p>
            <div className="mt-3">
              {stats.percentage === 100 && stats.total > 0 ? (
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                  Unlocked 🏆
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Locked</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment-by-Assignment Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Coursework Submission Log
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            {submissions.length} Total Assignments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Assignment Title</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Confirmed Date</th>
                <th className="py-3.5 px-4">Submitted By</th>
                <th className="py-3.5 px-6 text-right">OneDrive Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {submissions.map((sub) => {
                const isConfirmed = sub.hasSubmitted;
                const dueDateFormatted = new Date(sub.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const confirmedDateFormatted = sub.confirmedAt
                  ? new Date(sub.confirmedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—';

                return (
                  <tr key={sub.assignmentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      {sub.assignmentTitle}
                    </td>
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                      {dueDateFormatted}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {confirmedDateFormatted}
                    </td>
                    <td className="py-4 px-4">
                      {sub.submittedBy ? (
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {sub.submittedBy.name}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <a
                        href={sub.onedriveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-bold hover:underline"
                      >
                        <span>OneDrive</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
