import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ProgressBar } from '../../components/ProgressBar';
import { Badge, MilestoneBadge, getMilestones } from '../../components/Badge';
import { StatusBadge } from '../../components/StatusBadge';
import { CountdownTimer } from '../../components/CountdownTimer';
import { SkeletonDashboard } from '../../components/SkeletonLoader';
import { ConfirmSubmissionModal } from '../../components/ConfirmSubmissionModal';
import {
  Users, BookOpen, CheckCircle2, Clock, ArrowRight, ExternalLink,
  PlusCircle, FileCheck, Award, Sparkles, Calendar, GraduationCap, Layers
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [groupData, setGroupData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [groupRes, asgRes, progressRes, coursesRes] = await Promise.all([
        api.getMyGroup(user.id),
        api.getAssignments(user),
        api.getMyGroupSubmissions(user.id),
        api.getCourses(user),
      ]);
      setGroupData(groupRes);
      setAssignments(asgRes || []);
      setProgress(progressRes?.stats || { total: 0, completed: 0, percentage: 0 });
      setCourses(coursesRes || []);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchDashboardData(); }, [user]);

  if (loading) return <SkeletonDashboard />;

  const group = groupData?.group;
  const groupRole = groupData?.role;
  const pendingAssignments = assignments.filter((a) => a.submissionStatus !== 'CONFIRMED');
  const milestones = getMilestones(progress.completed, progress.total);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Student Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {getGreeting()}, {user.name?.split(' ')[0]}!
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            {group
              ? `You're part of "${group.name}" with ${group.members?.length || 0} members. Keep up the great work!`
              : 'You haven\'t joined a group yet. Create or join one to start collaborating!'}
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-bold">{progress.total}</span>
              <span className="text-xs text-white/70">Assignments</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span className="text-sm font-bold">{progress.completed}</span>
              <span className="text-xs text-white/70">Completed</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm">
              <Award className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-bold">{progress.percentage}%</span>
              <span className="text-xs text-white/70">Progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in-up">
          {milestones.map((m) => (
            <MilestoneBadge key={m} type={m} size="md" />
          ))}
        </div>
      )}

      {/* Overall Progress */}
      <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Overall Submission Progress</h2>
          <span className="text-xs text-slate-500">{progress.completed}/{progress.total} done</span>
        </div>
        <ProgressBar value={progress.completed} max={progress.total} size="md" />
      </div>

      {/* Enrolled Courses */}
      {courses.length > 0 && (
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-brand-500" />
              My Courses
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course, i) => {
              const courseAssignments = assignments.filter((a) => a.courseId === course.id || a.course?.id === course.id);
              const completedInCourse = courseAssignments.filter((a) => a.submissionStatus === 'CONFIRMED').length;
              const totalInCourse = courseAssignments.length;

              return (
                <Link
                  key={course.id}
                  to={`/student/courses/${course.id}`}
                  className={`glass-card glass-card-hover p-5 space-y-3 animate-fade-in-up stagger-${i + 1} block group`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <Badge variant="brand">{course.code}</Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {course.professor?.name || 'Professor'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{totalInCourse} assignments</span>
                    <span className="font-bold text-success-500">{completedInCourse}/{totalInCourse} done</span>
                  </div>
                  <ProgressBar value={completedInCourse} max={totalInCourse} size="sm" showPercentage={false} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* No Group Notice */}
      {!group && (
        <div className="glass-card p-6 text-center space-y-3 border-2 border-dashed border-brand-200 dark:border-brand-800 animate-fade-in-up">
          <Users className="w-10 h-10 text-brand-400 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Join a Group to Get Started</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">Create your own group or join an existing one to access group assignments and start collaborating with classmates.</p>
          <Link to="/student/groups" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all">
            <PlusCircle className="w-4 h-4" />
            Manage Groups
          </Link>
        </div>
      )}

      {/* Pending Assignments */}
      {pendingAssignments.length > 0 && (
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning-500" />
            Pending Assignments ({pendingAssignments.length})
          </h2>
          <div className="space-y-3">
            {pendingAssignments.slice(0, 5).map((asg, i) => (
              <div
                key={asg.id}
                className={`glass-card glass-card-hover p-4 flex items-center justify-between gap-4 animate-fade-in-up stagger-${i + 1}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{asg.title}</h3>
                    <StatusBadge status={asg.submissionType} size="xs" />
                    <StatusBadge status={asg.submissionStatus} size="xs" />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    {asg.course && <span className="text-[11px] text-brand-500 font-semibold">{asg.course.code}</span>}
                    <CountdownTimer targetDate={asg.dueDate} />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={asg.onedriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-all"
                    title="Open OneDrive"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {asg.submissionStatus !== 'CONFIRMED' && (
                    <button
                      onClick={() => { setSelectedAssignment(asg); setConfirmModalOpen(true); }}
                      className="px-3 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Submit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group Info */}
      {group && (
        <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" />
              {group.name}
            </h2>
            <Badge variant={groupRole === 'LEADER' ? 'brand' : 'default'}>
              {groupRole === 'LEADER' ? '👑 Leader' : 'Member'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {group.members?.map((m) => (
              <div key={m.userId || m.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-400 to-indigo-400 flex items-center justify-center text-white text-[10px] font-bold">
                  {m.user?.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{m.user?.name}</p>
                  <p className="text-[10px] text-slate-400">{m.role === 'LEADER' ? '👑 Leader' : 'Member'}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right">
            <Link to="/student/groups" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1">
              Manage Group <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {confirmModalOpen && selectedAssignment && (
        <ConfirmSubmissionModal
          assignment={selectedAssignment}
          isOpen={confirmModalOpen}
          onClose={() => { setConfirmModalOpen(false); setSelectedAssignment(null); }}
          onConfirmed={() => { setConfirmModalOpen(false); setSelectedAssignment(null); fetchDashboardData(); }}
        />
      )}
    </div>
  );
};
