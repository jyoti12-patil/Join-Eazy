import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  Search,
  Filter,
  Cloud,
  FileText,
  UserCheck,
} from 'lucide-react';

export const SubmissionTracker = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

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
      try {
        const res = await api.getSubmissionsByAssignment(selectedAssignmentId);
        setTrackingData(res);
      } catch (err) {
        toast.error('Failed to load submission tracking data');
      }
    };

    fetchTracking();
  }, [selectedAssignmentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const { stats, groupStatus, assignment } = trackingData || {
    stats: { totalTargetGroups: 0, submittedCount: 0, pendingCount: 0, completionRate: 0 },
    groupStatus: [],
    assignment: null,
  };

  const filteredGroups = groupStatus.filter((gs) => {
    const q = searchFilter.toLowerCase();
    if (!q) return true;
    return (
      gs.group.name.toLowerCase().includes(q) ||
      gs.group.members.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.studentId && m.studentId.toLowerCase().includes(q))
      )
    );
  });

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-8">
      {/* Header & Assignment Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Submission Verification Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor group-wise confirmations and student-wise member participation
          </p>
        </div>

        {/* Assignment dropdown */}
        <div className="w-full md:w-80">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Select Coursework:
          </label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-xs"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                {a.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Target Groups
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.totalTargetGroups}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Confirmed Submissions
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.submittedCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Pending Confirmation
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {stats.pendingCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Completion Rate
          </div>
          <div className="text-2xl font-black text-brand-600 dark:text-brand-400 font-mono">
            {stats.completionRate}%
          </div>
        </div>
      </div>

      {/* Active Assignment Header Card with OneDrive Link */}
      {assignment && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <span className="text-[11px] uppercase tracking-wider font-bold text-brand-300">
              Active Monitoring Context
            </span>
            <h2 className="text-lg font-bold">{assignment.title}</h2>
            <div className="text-xs text-slate-400 flex items-center gap-3">
              <span>
                Due:{' '}
                <strong className="text-slate-200">
                  {new Date(assignment.dueDate).toLocaleString('en-US')}
                </strong>
              </span>
            </div>
          </div>

          <a
            href={assignment.onedriveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors shrink-0 cursor-pointer"
          >
            <Cloud className="w-4 h-4" />
            <span>Open OneDrive Grading Folder</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by group name or student name / ID..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <strong>{filteredGroups.length}</strong> Groups
        </div>
      </div>

      {/* Group-wise & Student-wise Detailed Breakdown Table */}
      <div className="space-y-4">
        {filteredGroups.map((item) => {
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
              key={item.group.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
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
                        {item.group.name}
                      </h3>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        ({item.group.membersCount} students)
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {isSubmitted ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          Confirmed on {confirmedAtFormatted} by{' '}
                          <strong className="text-slate-800 dark:text-slate-200">{item.submittedBy?.name || 'Group member'}</strong>
                        </span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-400 font-medium">
                          Pending submission confirmation
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Badge
                    status={isSubmitted ? 'CONFIRMED' : 'PENDING'}
                    text={isSubmitted ? 'Submitted & Confirmed' : 'Awaiting Submission'}
                    size="md"
                  />
                </div>
              </div>

              {/* Attached Note if any */}
              {item.submissionNote && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <div className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                    Student Submission Note:
                  </div>
                  <p className="italic text-slate-800 dark:text-slate-200">"{item.submissionNote}"</p>
                </div>
              )}

              {/* Student-wise Roster Grid */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Student Members & Roles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {item.group.members.map((member) => (
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
                      <Badge status={member.groupRole} size="xs" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
