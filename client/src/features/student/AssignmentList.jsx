import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ProgressBar } from '../../components/ProgressBar';
import { Badge } from '../../components/Badge';
import { StatusBadge } from '../../components/StatusBadge';
import { CountdownTimer } from '../../components/CountdownTimer';
import { ConfirmSubmissionModal } from '../../components/ConfirmSubmissionModal';
import { SkeletonCard } from '../../components/SkeletonLoader';
import {
  BookOpen, ExternalLink, FileCheck, Filter, Clock, CheckCircle2,
  AlertTriangle, Search, Layers, ChevronDown,
} from 'lucide-react';

export const AssignmentList = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const courseIdFilter = searchParams.get('courseId');

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const data = await api.getAssignments(user);
      setAssignments(data || []);
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (courseIdFilter && a.courseId !== courseIdFilter && a.course?.id !== courseIdFilter) return false;
      if (statusFilter !== 'ALL' && a.submissionStatus !== statusFilter) return false;
      if (typeFilter !== 'ALL' && a.submissionType !== typeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return a.title.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [assignments, statusFilter, typeFilter, searchQuery, courseIdFilter]);

  const statusCounts = useMemo(() => {
    const counts = { ALL: assignments.length, CONFIRMED: 0, NOT_SUBMITTED: 0, OVERDUE: 0, PENDING_CONFIRMATION: 0 };
    assignments.forEach((a) => { counts[a.submissionStatus] = (counts[a.submissionStatus] || 0) + 1; });
    return counts;
  }, [assignments]);

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 py-8 space-y-4">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} lines={3} />)}
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1 animate-fade-in">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-brand-500" />
          My Assignments
        </h1>
        <p className="text-sm text-slate-500">Browse and submit your coursework</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 animate-fade-in-up">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
          />
        </div>
        {/* Status Filter */}
        <div className="flex gap-1.5 flex-wrap">
          {['ALL', 'NOT_SUBMITTED', 'CONFIRMED', 'OVERDUE'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700'
              }`}
            >
              {s === 'ALL' ? 'All' : s === 'NOT_SUBMITTED' ? 'Pending' : s === 'CONFIRMED' ? 'Submitted' : 'Overdue'}
              <span className="ml-1 opacity-70">({statusCounts[s] || 0})</span>
            </button>
          ))}
        </div>
        {/* Type Filter */}
        <div className="flex gap-1.5">
          {['ALL', 'GROUP', 'INDIVIDUAL'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                typeFilter === t
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment Cards */}
      {filteredAssignments.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-slate-600 dark:text-slate-400">No assignments found</h3>
          <p className="text-xs text-slate-400 mt-1">Try changing your filter or search criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((asg, i) => (
            <div
              key={asg.id}
              className={`glass-card glass-card-hover p-5 space-y-3 animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{asg.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{asg.description}</p>
                </div>
                <StatusBadge status={asg.submissionStatus} size="sm" />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={asg.submissionType || 'GROUP'} size="xs" />
                {asg.course && (
                  <Badge variant="brand">{asg.course.code || asg.course.name}</Badge>
                )}
                {asg.isGlobal === false && (
                  <Badge variant="warning">Targeted</Badge>
                )}
                <CountdownTimer targetDate={asg.dueDate} />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={asg.onedriveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open OneDrive
                </a>
                {asg.submissionStatus !== 'CONFIRMED' ? (
                  <button
                    onClick={() => { setSelectedAssignment(asg); setConfirmModalOpen(true); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    Submit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-success-500">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Submitted
                    </span>
                    {(assignment.groupSubmission?.grade !== null && assignment.groupSubmission?.grade !== undefined) ? (
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                        {assignment.groupSubmission.grade} / 10
                      </span>
                    ) : (assignment.individualSubmission?.grade !== null && assignment.individualSubmission?.grade !== undefined) ? (
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                        {assignment.individualSubmission.grade} / 10
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submission Modal */}
      {confirmModalOpen && selectedAssignment && (
        <ConfirmSubmissionModal
          assignment={selectedAssignment}
          isOpen={confirmModalOpen}
          onClose={() => { setConfirmModalOpen(false); setSelectedAssignment(null); }}
          onConfirmed={() => { setConfirmModalOpen(false); setSelectedAssignment(null); fetchAssignments(); }}
        />
      )}
    </div>
  );
};
