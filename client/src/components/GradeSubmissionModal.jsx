import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Modal } from './Modal';
import {
  Award,
  ExternalLink,
  MessageSquare,
  Cloud,
  CheckCircle2,
  Sparkles,
  User,
  Users,
} from 'lucide-react';

export const GradeSubmissionModal = ({ isOpen, onClose, target, onGradeSaved }) => {
  const toast = useToast();

  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && target) {
      setGrade(target.grade !== null && target.grade !== undefined ? target.grade : '');
      setFeedback(target.feedback || '');
    }
  }, [isOpen, target]);

  if (!target) return null;

  const handlePreset = (score) => {
    setGrade(score === null ? '' : score);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let numericGrade = null;
    if (grade !== '' && grade !== null) {
      numericGrade = Number(grade);
      if (isNaN(numericGrade) || numericGrade < 1 || numericGrade > 10) {
        toast.error('Rating must be a number between 1 and 10');
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.gradeSubmission(target.submissionId, {
        assignmentId: target.assignmentId,
        groupId: target.groupId || null,
        studentId: target.studentId || null,
        grade: numericGrade,
        feedback: feedback.trim() || null,
      });

      toast.success(numericGrade !== null ? `Rated ${numericGrade}/10 successfully` : 'Feedback saved');
      if (onGradeSaved) onGradeSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save rating');
    } finally {
      setSubmitting(false);
    }
  };

  const isIndividual = Boolean(target.student);
  const targetTitle = isIndividual ? target.student?.name : target.group?.name;
  const targetSubtitle = isIndividual
    ? `${target.student?.email}${target.student?.studentId ? ` • ${target.student?.studentId}` : ''}`
    : `${target.group?.membersCount || target.group?.members?.length || 0} students`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rating & Feedback Evaluation"
      subtitle={`Coursework: ${target.assignmentTitle || 'Assignment'} (Scale 1–10)`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Target Profile Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-sm border border-brand-200/60 dark:border-brand-800/60 shrink-0">
              {isIndividual ? <User className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {targetTitle}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {targetSubtitle}
              </div>
            </div>
          </div>

          {target.onedriveLink && (
            <a
              href={target.onedriveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>OneDrive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Student Note Preview if any */}
        {target.submissionNote && (
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/70 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300">
            <div className="font-bold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-0.5">
              Student Note:
            </div>
            <p className="italic">"{target.submissionNote}"</p>
          </div>
        )}

        {/* Numeric Grade Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Rating (1 - 10)
            </label>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              {grade !== '' ? `${grade} / 10` : 'Not rated'}
            </span>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-2 mb-2">
            {[10, 9.5, 9, 8.5, 8, 7].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => handlePreset(score)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  Number(grade) === score
                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-500/50'
                }`}
              >
                {score}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePreset(null)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ml-auto cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="relative">
            <Award className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              min={1}
              max={10}
              step={0.1}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g. 9.5"
              className="w-full pl-9 pr-4 py-2.5 text-sm font-mono font-bold rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Written Qualitative Feedback */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Professor Feedback & Comments</span>
          </label>
          <textarea
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write evaluation remarks, rubric feedback, or suggestions for improvement..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {submitting ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>{submitting ? 'Saving...' : 'Save Grade & Feedback'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GradeSubmissionModal;
