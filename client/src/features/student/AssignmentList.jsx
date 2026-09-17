import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { ConfirmSubmissionModal } from '../../components/ConfirmSubmissionModal';
import {
  BookOpen,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  Cloud,
  FileCheck,
  AlertCircle,
  Users,
} from 'lucide-react';

export const AssignmentList = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [assignments, setAssignments] = useState([]);
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, SUBMITTED

  // Confirmation modal state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [asgRes, groupRes] = await Promise.all([
        api.getAssignments(user),
        api.getMyGroup(user.id),
      ]);

      setAssignments(asgRes || []);
      setGroupData(groupRes);
    } catch (err) {
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleOpenConfirm = (assignment) => {
    if (!groupData?.group) {
      toast.error('You must belong to a group before submitting assignments. Please form or join a group first.');
      return;
    }
    setSelectedAssignment(assignment);
    setConfirmModalOpen(true);
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'ALL') return true;
    if (filter === 'SUBMITTED') return a.submissionStatus === 'CONFIRMED';
    if (filter === 'PENDING') return a.submissionStatus !== 'CONFIRMED';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const group = groupData?.group;

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-8">
      {/* Header & Filter tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Assignments Feed
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Access professor instructions, OneDrive repositories, and confirm submissions
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/60 rounded-2xl w-fit">
          {['ALL', 'PENDING', 'SUBMITTED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-white dark:bg-brand-600 text-brand-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'ALL' ? 'All Assignments' : tab === 'PENDING' ? 'Pending' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Warning banner if not in group */}
      {!group && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              You currently do not have a group. Form a group in <strong>My Group</strong> so your group's submissions can be logged and verified.
            </span>
          </div>
        </div>
      )}

      {/* Assignments Cards Grid */}
      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAssignments.map((assignment) => {
            const isConfirmed = assignment.submissionStatus === 'CONFIRMED';
            const isOverdue = assignment.submissionStatus === 'OVERDUE';
            const dueDateObj = new Date(assignment.dueDate);
            const formattedDate = dueDateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={assignment.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge status={assignment.submissionStatus} />
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                      {assignment.isGlobal ? 'All Groups' : 'Selective Assignment'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                      {assignment.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {assignment.description}
                    </p>
                  </div>

                  {/* Meta details */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Due: <strong className={isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}>{formattedDate}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                      <Cloud className="w-3.5 h-3.5" />
                      OneDrive Linked
                    </span>
                  </div>
                </div>

                {/* Actions & Status */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {/* OneDrive Link Button */}
                  <a
                    href={assignment.onedriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Open OneDrive Submission Folder</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                  </a>

                  {/* Two-step confirmation trigger or confirmed status */}
                  {isConfirmed ? (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Submitted by {assignment.groupSubmission?.submittedBy?.name || 'Group'}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded font-mono border border-emerald-200 dark:border-emerald-800">
                        Locked
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenConfirm(assignment)}
                      className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-glow transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Confirm Submission (2-Step Verification)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No assignments found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {filter === 'SUBMITTED'
              ? 'You have not submitted any assignments yet.'
              : 'No pending assignments match your active filter.'}
          </p>
        </div>
      )}

      {/* TWO-STEP SUBMISSION CONFIRMATION MODAL */}
      <ConfirmSubmissionModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        assignment={selectedAssignment}
        group={group}
        onSuccess={fetchData}
      />
    </div>
  );
};
