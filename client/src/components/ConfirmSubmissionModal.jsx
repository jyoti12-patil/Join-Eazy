import React, { useState } from 'react';
import { Modal } from './Modal';
import { ExternalLink, CheckCircle, ArrowLeft, AlertTriangle, Cloud } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ConfirmSubmissionModal = ({
  isOpen,
  onClose,
  assignment,
  group,
  onSuccess,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [submissionNote, setSubmissionNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!assignment) return null;

  const handleResetAndClose = () => {
    setStep(1);
    setSubmissionNote('');
    onClose();
  };

  const handleStep1Proceed = () => {
    setStep(2);
  };

  const handleFinalConfirm = async () => {
    if (!group) {
      toast.error('You must be in a group to submit assignments.');
      return;
    }

    setLoading(true);
    try {
      await api.confirmSubmission(user.id, {
        assignmentId: assignment.id,
        confirmed: true,
        submissionNote: submissionNote.trim(),
      });

      toast.success(`Submission confirmed for "${assignment.title}"!`);
      if (onSuccess) await onSuccess();
      handleResetAndClose();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={step === 1 ? 'Two-Step Submission Verification' : 'Final Submission Confirmation'}
      subtitle={`Assignment: ${assignment.title}`}
      maxWidth="max-w-xl"
    >
      {step === 1 ? (
        <div className="space-y-6">
          {/* Step 1 banner */}
          <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/60 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <div>
                <div className="text-xs font-semibold text-brand-900 dark:text-indigo-200 uppercase tracking-wider">
                  Step 1 of 2
                </div>
                <div className="text-sm font-medium text-brand-700 dark:text-indigo-300">
                  Verify OneDrive Upload
                </div>
              </div>
            </div>
            <span className="text-xs font-medium bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              Group: {group?.name || 'Your Group'}
            </span>
          </div>

          {/* OneDrive link launch card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-blue-500" />
                OneDrive Submission Folder
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">External Upload</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Ensure you have placed your group's source code, documentation, and demo links inside the professor's shared OneDrive directory.
            </p>
            <a
              href={assignment.onedriveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <span>Open OneDrive Folder</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Optional Submission Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Submission Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={submissionNote}
              onChange={(e) => setSubmissionNote(e.target.value)}
              placeholder="e.g. Uploaded final zip file v2.1 including test coverage reports and benchmark video."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Step 1 Action */}
          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleResetAndClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStep1Proceed}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 hover:shadow-glow cursor-pointer"
            >
              <span>Yes, I have submitted</span>
              <span className="text-xs opacity-75">→ Step 2</span>
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: FINAL CONFIRMATION */
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              <div>
                <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                  Step 2 of 2
                </div>
                <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Confirm and Record Group Submission
                </div>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 rounded-xl flex gap-3 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">Important:</span> You are locking in this submission on behalf of all members in{' '}
              <span className="font-semibold underline">{group?.name || 'your group'}</span>. The professor will immediately see your confirmation timestamp and note on the dashboard.
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Confirmed by:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name} ({user?.email})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Target Group:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{group?.name}</span>
            </div>
            {submissionNote && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Attached Note:</span>
                <p className="italic text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                  "{submissionNote}"
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={loading}
              onClick={() => setStep(1)}
              className="px-3.5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleResetAndClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleFinalConfirm}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>Recording...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Submission</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
