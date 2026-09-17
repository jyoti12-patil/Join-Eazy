import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import {
  BookOpen,
  PlusCircle,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  Users,
  CheckCircle,
  Clock,
  Cloud,
} from 'lucide-react';

export const AssignmentManager = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [assignments, setAssignments] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    onedriveLink: '',
    isGlobal: true,
    groupIds: [],
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const [asgRes, groupsRes] = await Promise.all([
        api.getAssignments(user),
        api.getAllGroups(),
      ]);

      setAssignments(asgRes || []);
      setAllGroups(groupsRes || []);
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleOpenCreate = () => {
    setEditingAssignment(null);
    const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const dateString = defaultDate.toISOString().slice(0, 16);

    setFormData({
      title: '',
      description: '',
      dueDate: dateString,
      onedriveLink: 'https://onedrive.live.com/?id=joineazy-',
      isGlobal: true,
      groupIds: [],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (assignment) => {
    setEditingAssignment(assignment);
    const dateString = new Date(assignment.dueDate).toISOString().slice(0, 16);

    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: dateString,
      onedriveLink: assignment.onedriveLink,
      isGlobal: assignment.isGlobal,
      groupIds: assignment.assignmentGroups?.map((ag) => ag.groupId) || [],
    });
    setModalOpen(true);
  };

  const handleToggleGroupSelection = (groupId) => {
    setFormData((prev) => {
      const exists = prev.groupIds.includes(groupId);
      const newGroupIds = exists
        ? prev.groupIds.filter((id) => id !== groupId)
        : [...prev.groupIds, groupId];
      return { ...prev, groupIds: newGroupIds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter an assignment title');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter assignment description');
      return;
    }
    if (!formData.dueDate) {
      toast.error('Please select a due date');
      return;
    }
    if (!formData.onedriveLink.trim()) {
      toast.error('Please enter a OneDrive submission URL');
      return;
    }
    if (!formData.isGlobal && formData.groupIds.length === 0) {
      toast.error('Please select at least one group for targeted assignment');
      return;
    }

    setSubmitting(true);
    try {
      let normalizedDueDate = formData.dueDate;
      try {
        const parsedDate = new Date(formData.dueDate);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date');
        }
        normalizedDueDate = parsedDate.toISOString();
      } catch (err) {
        toast.error('Please enter a valid due date');
        setSubmitting(false);
        return;
      }

      let normalizedLink = formData.onedriveLink.trim();
      if (normalizedLink && !/^https?:\/\//i.test(normalizedLink)) {
        normalizedLink = `https://${normalizedLink}`;
      }

      try {
        new URL(normalizedLink);
      } catch {
        toast.error('Please enter a valid OneDrive URL (e.g. https://onedrive.live.com/...)');
        setSubmitting(false);
        return;
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: normalizedDueDate,
        onedriveLink: normalizedLink,
        isGlobal: Boolean(formData.isGlobal),
        groupIds: formData.isGlobal ? [] : formData.groupIds,
      };

      if (editingAssignment) {
        await api.updateAssignment(editingAssignment.id, payload);
        toast.success(`Assignment "${payload.title}" updated!`);
      } else {
        await api.createAssignment(payload, user);
        toast.success(`Assignment "${payload.title}" published!`);
      }

      setModalOpen(false);
      await fetchAssignments();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete assignment "${title}"?`)) {
      return;
    }

    try {
      await api.deleteAssignment(id);
      toast.success(`Deleted assignment "${title}".`);
      fetchAssignments();
    } catch (err) {
      toast.error(err.message || 'Failed to delete assignment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Assignments Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create, edit, and target coursework with OneDrive submission links
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md hover:shadow-glow transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Assignment</span>
        </button>
      </div>

      {/* Assignments Table/Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Published Assignments ({assignments.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {assignments.map((assignment) => {
            const dueDateFormatted = new Date(assignment.dueDate).toLocaleDateString(
              'en-US',
              {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }
            );

            return (
              <div
                key={assignment.id}
                className="p-6 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        assignment.isGlobal
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                          : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
                      }`}
                    >
                      {assignment.isGlobal
                        ? 'All Groups'
                        : `Targeted (${assignment.assignmentGroups?.length || 0} Groups)`}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Due {dueDateFormatted}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {assignment.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {assignment.description}
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    <a
                      href={assignment.onedriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold hover:underline"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>OneDrive Folder</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                  <button
                    onClick={() => handleOpenEdit(assignment)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    title="Edit assignment"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(assignment.id, assignment.title)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800/60 transition-colors cursor-pointer"
                    title="Delete assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE / EDIT ASSIGNMENT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAssignment ? 'Edit Assignment' : 'Post New Assignment'}
        subtitle="Configure assignment details, deadlines, and target student groups"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Assignment Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Assignment 4: Distributed Consensus Protocols"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Description & Requirements
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detail the technical assignment guidelines, expected file formats, and evaluation metrics..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Submission Due Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                OneDrive Submission URL
              </label>
              <input
                type="url"
                required
                value={formData.onedriveLink}
                onChange={(e) =>
                  setFormData({ ...formData, onedriveLink: e.target.value })
                }
                placeholder="https://onedrive.live.com/?id=..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Group Targeting Configuration */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Assignment Scope (Targeting)
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isGlobal: true, groupIds: [] })}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  formData.isGlobal
                    ? 'bg-brand-50 dark:bg-brand-950/70 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>🌍 Assign to All Groups</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isGlobal: false })}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !formData.isGlobal
                    ? 'bg-purple-50 dark:bg-purple-950/70 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>🎯 Select Specific Groups</span>
              </button>
            </div>

            {!formData.isGlobal && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 max-h-40 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Check Groups to Assign:
                </div>
                {allGroups.map((g) => {
                  const isChecked = formData.groupIds.includes(g.id);
                  return (
                    <label
                      key={g.id}
                      className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleGroupSelection(g.id)}
                        className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="font-bold">{g.name}</span>
                      <span className="text-slate-400 dark:text-slate-500">
                        ({g.members.length} members)
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {submitting
                ? 'Saving...'
                : editingAssignment
                ? 'Update Assignment'
                : 'Publish Assignment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
