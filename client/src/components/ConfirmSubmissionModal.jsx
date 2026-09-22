import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { AnimatedCheckmark } from './AnimatedCheckmark';
import { StatusBadge } from './StatusBadge';
import {
  X, ExternalLink, FileCheck, Loader2, CheckCircle2, Shield, User,
  AlertTriangle, Send, Clock,
} from 'lucide-react';

export const ConfirmSubmissionModal = ({ assignment, isOpen, onClose, onConfirmed, onSubmissionSuccess }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState(1); // 1: Review, 2: Confirm, 3: Success
  const [submissionNote, setSubmissionNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !assignment) return null;

  const isIndividual = assignment.submissionType === 'INDIVIDUAL';
  const isGroup = assignment.submissionType === 'GROUP' || !assignment.submissionType;

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await api.confirmSubmission(user.id, {
        assignmentId: assignment.id,
        confirmed: true,
        submissionNote: submissionNote.trim() || null,
      });
      setStep(3);
      toast.success(`Submission confirmed for "${assignment.title}"!`);
      setTimeout(() => {
        const callback = onConfirmed || onSubmissionSuccess || onClose;
        callback?.();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to confirm submission');
      toast.error(err.message || 'Failed to confirm submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200/80 dark:border-slate-800 animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center text-white">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Confirm Submission</h3>
              <p className="text-[11px] text-slate-400">
                {isIndividual ? 'Individual Submission' : 'Group Submission'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Step Progress */}
        <div className="px-6 py-3 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s
                  ? step === 3 && s === 3 ? 'bg-success-500 text-white' : 'bg-brand-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step > s ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="px-6 py-4">
          {/* Step 1: Review */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{assignment.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{assignment.description}</p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={assignment.submissionType || 'GROUP'} size="sm" />
                {assignment.course && (
                  <span className="text-xs font-semibold text-brand-500">{assignment.course?.code}</span>
                )}
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </div>
              </div>

              <a
                href={assignment.onedriveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors text-xs font-semibold"
              >
                <ExternalLink className="w-4 h-4" />
                Open OneDrive Submission Folder
              </a>

              {isGroup && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                  <Shield className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <strong>Group assignment:</strong> Only the group leader can confirm submission. This will be reflected for all group members.
                  </p>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Yes, I have uploaded to OneDrive
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Final Confirm */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mx-auto mb-3">
                  <Send className="w-5 h-5 text-brand-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Final Confirmation</h4>
                <p className="text-xs text-slate-500 mt-1">Add an optional note and confirm your submission.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Submission Note (optional)
                </label>
                <textarea
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  placeholder="e.g., Uploaded complete source code and documentation..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all placeholder:text-slate-400 resize-none"
                />
                <p className="text-[10px] text-slate-400 mt-1 text-right">{submissionNote.length}/500</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-danger-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-3 bg-success-500 text-white rounded-xl text-sm font-bold hover:bg-success-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting...</span></>
                  ) : (
                    <><span>Confirm Submission</span><CheckCircle2 className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center space-y-4 py-6 animate-fade-in">
              <AnimatedCheckmark size={72} />
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Submission Confirmed! 🎉
              </h4>
              <p className="text-sm text-slate-500">
                {isGroup
                  ? 'Your group\'s submission has been recorded. All group members will see this as confirmed.'
                  : 'Your individual submission has been recorded successfully.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmSubmissionModal;
