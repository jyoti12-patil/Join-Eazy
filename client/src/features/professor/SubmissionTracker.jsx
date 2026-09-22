import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { StatusBadge } from '../../components/StatusBadge';
import { ProgressBar } from '../../components/ProgressBar';
import { SkeletonList, SkeletonCard } from '../../components/SkeletonLoader';
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  User,
  Search,
  Filter,
  Cloud,
  FileText,
  UserCheck,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  Mail,
  GraduationCap,
  Award,
} from 'lucide-react';
import { GradeSubmissionModal } from '../../components/GradeSubmissionModal';

export const SubmissionTracker = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, SUBMITTED, PENDING
  const [sortBy, setSortBy] = useState('NAME'); // NAME, STATUS, DATE
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedTargetForGrading, setSelectedTargetForGrading] = useState(null);

  // Initial load
  useEffect(() => {
    const fetchInit = async () => {
      setLoading(true);
      try {
        const asgList = await api.getAssignments(user);
        setAssignments(asgList || []);
        if (asgList && asgList.length > 0) {
          setSelectedAssignmentId(asgList[0].id);
        }
      } catch (err) {
        toast.error('Failed to load assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchInit();
  }, [user]);

  // Load tracking data when selected assignment changes
  useEffect(() => {
    if (!selectedAssignmentId) return;

    const fetchTracking = async () => {
      setTrackingLoading(true);
      try {
        const res = await api.getSubmissionsByAssignment(selectedAssignmentId);
        setTrackingData(res);
      } catch (err) {
        toast.error('Failed to load submission tracking data');
      } finally {
        setTrackingLoading(false);
      }
    };

    fetchTracking();
  }, [selectedAssignmentId]);

  const { stats, groupStatus, studentStatus, assignment } = trackingData || {
    stats: { totalTargetGroups: 0, totalTargetStudents: 0, totalTarget: 0, submittedCount: 0, pendingCount: 0, completionRate: 0 },
    groupStatus: [],
    studentStatus: [],
    assignment: null,
  };

  const handleOpenGradeModal = (item) => {
    setSelectedTargetForGrading({
      assignmentId: selectedAssignmentId,
      assignmentTitle: assignment?.title || 'Assignment',
      onedriveLink: assignment?.onedriveLink,
      submissionId: item.submissionId || null,
      student: item.student || null,
      studentId: item.student?.id || null,
      group: item.group || null,
      groupId: item.group?.id || null,
      grade: item.grade ?? null,
      feedback: item.feedback ?? null,
      submissionNote: item.submissionNote || null,
    });
    setGradeModalOpen(true);
  };

  const refreshTrackingData = async () => {
    if (!selectedAssignmentId) return;
    try {
      const res = await api.getSubmissionsByAssignment(selectedAssignmentId);
      setTrackingData(res);
    } catch (err) {}
  };

  const isIndividual = (assignment?.submissionType === 'INDIVIDUAL') || (trackingData?.assignment?.submissionType === 'INDIVIDUAL');

  const filteredAndSortedGroups = useMemo(() => {
    if (isIndividual) return [];
    let result = (groupStatus || []).filter((gs) => {
      // Status filter
      if (statusFilter === 'SUBMITTED' && !gs.hasSubmitted) return false;
      if (statusFilter === 'PENDING' && gs.hasSubmitted) return false;

      // Search filter
      const q = searchFilter.toLowerCase().trim();
      if (!q) return true;
      return (
        gs.group?.name?.toLowerCase().includes(q) ||
        gs.group?.members?.some(
          (m) =>
            m.name?.toLowerCase().includes(q) ||
            m.email?.toLowerCase().includes(q) ||
            (m.studentId && m.studentId?.toLowerCase().includes(q))
        )
      );
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'NAME') {
        return (a.group?.name || '').localeCompare(b.group?.name || '');
      }
      if (sortBy === 'STATUS') {
        return (b.hasSubmitted ? 1 : 0) - (a.hasSubmitted ? 1 : 0);
      }
      if (sortBy === 'DATE') {
        const dateA = a.confirmedAt ? new Date(a.confirmedAt).getTime() : 0;
        const dateB = b.confirmedAt ? new Date(b.confirmedAt).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });

    return result;
  }, [isIndividual, groupStatus, searchFilter, statusFilter, sortBy]);

  const filteredAndSortedStudents = useMemo(() => {
    if (!isIndividual) return [];
    let result = (studentStatus || []).filter((ss) => {
      // Status filter
      if (statusFilter === 'SUBMITTED' && !ss.hasSubmitted) return false;
      if (statusFilter === 'PENDING' && ss.hasSubmitted) return false;

      // Search filter
      const q = searchFilter.toLowerCase().trim();
      if (!q) return true;
      return (
        ss.student?.name?.toLowerCase().includes(q) ||
        ss.student?.email?.toLowerCase().includes(q) ||
        (ss.student?.studentId && ss.student?.studentId?.toLowerCase().includes(q))
      );
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'NAME') {
        return (a.student?.name || '').localeCompare(b.student?.name || '');
      }
      if (sortBy === 'STATUS') {
        return (b.hasSubmitted ? 1 : 0) - (a.hasSubmitted ? 1 : 0);
      }
      if (sortBy === 'DATE') {
        const dateA = a.confirmedAt ? new Date(a.confirmedAt).getTime() : 0;
        const dateB = b.confirmedAt ? new Date(b.confirmedAt).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });

    return result;
  }, [isIndividual, studentStatus, searchFilter, statusFilter, sortBy]);

  const targetCount = isIndividual
    ? (stats?.totalTargetStudents ?? stats?.totalTarget ?? 0)
    : (stats?.totalTargetGroups ?? stats?.totalTarget ?? 0);

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 py-8 space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-64 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header & Assignment Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Submission Verification Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time compliance audit of student and cohort submission confirmations
          </p>
        </div>

        {/* Assignment dropdown */}
        <div className="w-full md:w-96">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Select Coursework to Monitor:
          </label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-xs"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                {a.title} ({a.submissionType === 'INDIVIDUAL' ? 'Individual' : 'Group'}) — {new Date(a.dueDate).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            {isIndividual ? 'Target Students' : 'Target Groups'}
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
            {targetCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {isIndividual ? 'Enrolled students' : 'Assigned cohorts'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Confirmed Submissions
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {stats?.submittedCount || 0}
          </div>
          <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle className="w-3 h-3" /> Confirmed on OneDrive
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Pending Confirmation
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {stats?.pendingCount || 0}
          </div>
          <div className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1 flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3" /> {isIndividual ? 'Awaiting student confirmation' : 'Awaiting leader acknowledgment'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completion Rate
            </span>
            <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400">
              {stats?.completionRate || 0}%
            </span>
          </div>
          <div className="text-3xl font-black text-brand-600 dark:text-brand-400 font-mono mb-2">
            {stats?.completionRate || 0}%
          </div>
          <ProgressBar value={stats?.completionRate || 0} size="sm" showPercentage={false} />
        </div>
      </div>

      {/* Active Assignment Header Card with OneDrive Link */}
      {assignment && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded-full border border-brand-500/20">
                {isIndividual ? 'Individual Assignment' : 'Group Assignment'}
              </span>
              <span className="text-xs text-slate-400">
                Due: <strong className="text-slate-200">{new Date(assignment.dueDate).toLocaleString('en-US')}</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">{assignment.title}</h2>
            <p className="text-xs text-slate-300 line-clamp-1">{assignment.description}</p>
          </div>

          <a
            href={assignment.onedriveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 hover:shadow-glow transition-all shrink-0 cursor-pointer"
          >
            <Cloud className="w-4 h-4" />
            <span>Open OneDrive Grading Folder</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={isIndividual ? "Search by student name, email, or student ID..." : "Search by group name or student name / ID..."}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 placeholder:text-slate-400"
          />
        </div>

        {/* Filter & Sort Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/60 dark:border-slate-700">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'SUBMITTED', label: 'Submitted' },
              { id: 'PENDING', label: 'Pending' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="NAME">{isIndividual ? 'Sort: Student Name' : 'Sort: Group Name'}</option>
            <option value="STATUS">Sort: Submission Status</option>
            <option value="DATE">Sort: Submission Time</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {trackingLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6">
          <SkeletonList count={4} />
        </div>
      ) : isIndividual ? (
        /* INDIVIDUAL ASSIGNMENT: Student Submission Audit Table */
        filteredAndSortedStudents.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
            <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No students found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchFilter || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or filters.'
                : 'No students are currently targeted or enrolled for this assignment.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Student Roster ({filteredAndSortedStudents.length})</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/40 text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                    <th className="py-4 px-6">Student</th>
                    <th className="py-4 px-4">Student ID</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Rating</th>
                    <th className="py-4 px-4">Confirmed At</th>
                    <th className="py-4 px-6">Feedback / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredAndSortedStudents.map((item) => {
                    const isSubmitted = item.hasSubmitted;
                    const confirmedAtFormatted = item.confirmedAt
                      ? new Date(item.confirmedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—';

                    return (
                      <tr
                        key={item.student?.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-xs shrink-0 border border-brand-200/50 dark:border-brand-800/50">
                              {item.student?.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {item.student?.name || 'Unknown Student'}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                {item.student?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {item.student?.studentId || '—'}
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge
                            status={isSubmitted ? 'CONFIRMED' : 'PENDING'}
                            size="sm"
                          />
                        </td>
                        <td className="py-4 px-4">
                          {item.grade !== null && item.grade !== undefined ? (
                            <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                              {item.grade} / 10
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Unrated</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {confirmedAtFormatted}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate max-w-[150px]">
                              {item.feedback ? (
                                <span className="italic text-slate-700 dark:text-slate-300 truncate block text-[11px]" title={item.feedback}>
                                  "{item.feedback}"
                                </span>
                              ) : item.submissionNote ? (
                                <span className="text-slate-500 dark:text-slate-400 truncate block text-[11px]" title={item.submissionNote}>
                                  Note: {item.submissionNote}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500">—</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenGradeModal(item)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:hover:bg-brand-950/60 dark:hover:text-brand-400 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Award className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                              <span>{item.grade !== null && item.grade !== undefined ? 'Edit Rating' : 'Rate'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* GROUP ASSIGNMENT: Group-wise Breakdown */
        filteredAndSortedGroups.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No groups found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchFilter || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or filters.'
                : 'No student groups are currently targeted for this assignment.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedGroups.map((item, index) => {
              const isSubmitted = item.hasSubmitted;
              const confirmedAtFormatted = item.confirmedAt
                ? new Date(item.confirmedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;

              return (
                <div
                  key={item.group?.id || index}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4 animate-slide-up"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  {/* Group Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center text-sm border border-indigo-100/50 dark:border-indigo-800/50">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {item.group?.name}
                          </h3>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            ({item.group?.membersCount || item.group?.members?.length || 0} students)
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {isSubmitted ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                              Confirmed on {confirmedAtFormatted} by{' '}
                              <strong className="text-slate-800 dark:text-slate-200">
                                {item.submittedBy?.name || 'Group Leader'}
                              </strong>
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400 font-medium">
                              Pending submission confirmation
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.grade !== null && item.grade !== undefined ? (
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          Rating: {item.grade} / 10
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-semibold">Unrated</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenGradeModal(item)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:hover:bg-brand-950/60 dark:hover:text-brand-400 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                        <span>{item.grade !== null && item.grade !== undefined ? 'Edit Rating' : 'Rate Group'}</span>
                      </button>
                      <StatusBadge
                        status={isSubmitted ? 'CONFIRMED' : 'PENDING'}
                        size="md"
                      />
                    </div>
                  </div>

                  {/* Attached Note & Feedback */}
                  {item.submissionNote && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      <div className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                        Student Submission Note:
                      </div>
                      <p className="italic text-slate-800 dark:text-slate-200">"{item.submissionNote}"</p>
                    </div>
                  )}

                  {item.feedback && (
                    <div className="p-3 bg-brand-50/70 dark:bg-brand-950/30 rounded-xl border border-brand-200/60 dark:border-brand-800/40 text-xs text-brand-900 dark:text-brand-300">
                      <div className="font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        <span>Instructor Feedback ({item.grade !== null && item.grade !== undefined ? `${item.grade} / 10` : 'Rated'}):</span>
                      </div>
                      <p className="italic text-slate-800 dark:text-slate-200">"{item.feedback}"</p>
                    </div>
                  )}

                  {/* Student-wise Roster Grid */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Student Members & Roles</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {item.group?.members?.map((member) => (
                        <div
                          key={member.id}
                          className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between text-xs"
                        >
                          <div className="truncate mr-2">
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {member.name}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                              {member.email} {member.studentId && `• ${member.studentId}`}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                              member.groupRole === 'LEADER'
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {member.groupRole === 'LEADER' ? '⭐ Leader' : 'Member'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* GRADE & FEEDBACK MODAL */}
      {selectedTargetForGrading && (
        <GradeSubmissionModal
          isOpen={gradeModalOpen}
          onClose={() => {
            setGradeModalOpen(false);
            setSelectedTargetForGrading(null);
          }}
          target={selectedTargetForGrading}
          onGradeSaved={refreshTrackingData}
        />
      )}
    </div>
  );
};

export default SubmissionTracker;
