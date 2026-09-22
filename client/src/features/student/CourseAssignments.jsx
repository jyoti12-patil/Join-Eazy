import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/StatusBadge';
import { CountdownTimer } from '../../components/CountdownTimer';
import { ProgressBar } from '../../components/ProgressBar';
import { SkeletonList, SkeletonCard } from '../../components/SkeletonLoader';
import { ConfirmSubmissionModal } from '../../components/ConfirmSubmissionModal';
import {
  GraduationCap,
  ArrowLeft,
  Calendar,
  Cloud,
  ExternalLink,
  Users,
  User,
  CheckCircle2,
  Clock,
  BookOpen,
  Search,
  Filter,
  AlertCircle,
  FileCheck,
  Award,
} from 'lucide-react';

export const CourseAssignments = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [myGroup, setMyGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, SUBMITTED
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, GROUP, INDIVIDUAL
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesRes, asgRes, subRes, groupRes] = await Promise.all([
        api.getCourses(user),
        api.getAssignments(user),
        api.getMyGroupSubmissions(user?.id),
        api.getMyGroup(user?.id).catch(() => null),
      ]);

      const foundCourse = (coursesRes || []).find((c) => c.id === courseId);
      setCourse(foundCourse || null);

      // Filter assignments for this course
      const courseAssignments = (asgRes || []).filter((a) => a.courseId === courseId || a.course?.id === courseId);
      setAssignments(courseAssignments);
      const subList = Array.isArray(subRes) ? subRes : (subRes?.submissions || []);
      setSubmissions(subList);
      setMyGroup(groupRes);
    } catch (err) {
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  // Submission mapping
  const submissionMap = useMemo(() => {
    const map = {};
    if (Array.isArray(submissions)) {
      submissions.forEach((sub) => {
        map[sub.assignmentId] = sub;
      });
    }
    return map;
  }, [submissions]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((asg) => {
      const sub = submissionMap[asg.id];
      const isSub = Boolean(sub?.hasSubmitted || asg.submissionStatus === 'CONFIRMED');
      if (statusFilter === 'SUBMITTED' && !isSub) return false;
      if (statusFilter === 'PENDING' && isSub) return false;

      const type = asg.submissionType || 'GROUP';
      if (typeFilter !== 'ALL' && type !== typeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          asg.title?.toLowerCase().includes(q) ||
          asg.description?.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [assignments, submissionMap, statusFilter, typeFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter((a) => {
      const sub = submissionMap[a.id];
      return Boolean(sub?.hasSubmitted || a.submissionStatus === 'CONFIRMED');
    }).length;
    const pending = Math.max(0, total - completed);
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, rate };
  }, [assignments, submissionMap]);

  const handleOpenConfirmModal = (assignment) => {
    setSelectedAssignment(assignment);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-40 animate-pulse" />
        <SkeletonCard className="h-44" />
        <SkeletonList count={3} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="w-full px-4 sm:px-6 py-12 text-center space-y-4">
        <GraduationCap className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Course Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          The course you are looking for does not exist or you may not be enrolled.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md hover:bg-brand-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Back button */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Enrolled Courses</span>
        </Link>
      </div>

      {/* Course Hero Banner */}
      <div className="bg-gradient-to-br from-brand-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-brand-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-black px-3 py-1 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase tracking-wider">
                {course.code}
              </span>
              <span className="text-xs text-indigo-200">
                Instructor: <strong>{course.professor?.name || 'Faculty Member'}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {course.name}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
              {course.description || 'Comprehensive coursework, project milestones, and hands-on deliverables.'}
            </p>
          </div>

          {/* Progress widget */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shrink-0 min-w-[220px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Course Progress
              </span>
              <span className="text-xs font-extrabold text-brand-300">
                {stats.completed}/{stats.total}
              </span>
            </div>
            <div className="text-2xl font-black text-white font-mono mb-2">
              {stats.rate}%
            </div>
            <ProgressBar value={stats.rate} size="sm" showPercentage={false} />
            <div className="mt-2 text-[11px] text-slate-400">
              {stats.pending === 0 && stats.total > 0
                ? '🎉 All coursework submitted!'
                : `${stats.pending} remaining submission${stats.pending !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search assignments in this course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/60 dark:border-slate-700">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'SUBMITTED', label: 'Submitted' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === f.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="ALL">All Types</option>
            <option value="GROUP">👥 Group</option>
            <option value="INDIVIDUAL">👤 Individual</option>
          </select>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No assignments found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Try changing your filter options.'
              : 'There are currently no active assignments posted for this course.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment, index) => {
            const submission = submissionMap[assignment.id];
            const isSubmitted = Boolean(submission?.hasSubmitted || assignment.submissionStatus === 'CONFIRMED');
            const isGroup = (assignment.submissionType || 'GROUP') === 'GROUP';
            const isLeader = myGroup?.role === 'LEADER';

            return (
              <div
                key={assignment.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="space-y-2.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${
                        isGroup
                          ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-500/20'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/20'
                      }`}
                    >
                      {isGroup ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {isGroup ? 'Group Work' : 'Individual Work'}
                    </span>

                    <CountdownTimer targetDate={assignment.dueDate} compact />

                    <StatusBadge
                      status={isSubmitted ? 'CONFIRMED' : 'PENDING'}
                      size="sm"
                    />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {assignment.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {assignment.description}
                  </p>

                  {/* Professor Feedback if available */}
                  {sub?.feedback && (
                    <div className="p-3 bg-brand-50/70 dark:bg-brand-950/30 rounded-xl border border-brand-200/60 dark:border-brand-800/40 text-xs text-brand-900 dark:text-brand-300">
                      <div className="font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                        <span>Professor Feedback {sub.grade !== null && sub.grade !== undefined ? `(${sub.grade}/10)` : ''}:</span>
                      </div>
                      <p className="italic text-slate-800 dark:text-slate-200">"{sub.feedback}"</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                    <a
                      href={assignment.onedriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold hover:underline"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>OneDrive Folder</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <span className="text-slate-400 dark:text-slate-600">•</span>

                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Due {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="shrink-0 flex items-center">
                  {isSubmitted ? (
                    <div className="flex flex-col sm:items-end gap-1.5">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmed on OneDrive</span>
                      </div>
                      {sub?.grade !== null && sub?.grade !== undefined && (
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center gap-1">
                          <Award className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>Rating:</span>
                          <strong>{sub.grade} / 10</strong>
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenConfirmModal(assignment)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 hover:shadow-glow transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Confirm Submission</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Submission Modal */}
      {selectedAssignment && (
        <ConfirmSubmissionModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
          onConfirmed={() => {
            setModalOpen(false);
            setSelectedAssignment(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default CourseAssignments;
