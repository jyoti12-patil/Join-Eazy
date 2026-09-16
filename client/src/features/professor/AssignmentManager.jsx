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
    // Set default due date to 7 days from now formatted for datetime-local input
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
    if (!formData.title || !formData.dueDate || !formData.onedriveLink) {
      toast.error('Please fill in title, due date, and OneDrive link.');
      return;
    }

    if (!formData.isGlobal && formData.groupIds.length === 0) {
      toast.error('Please select at least one group for selective assignment, or toggle "Assign to All Groups".');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
      };

      if (editingAssignment) {
        await api.updateAssignment(editingAssignment.id, payload);
        toast.success(`Assignment "${formData.title}" updated.`);
      } else {
        await api.createAssignment(payload, user);
        toast.success(`Assignment "${formData.title}" published!`);
      }

      setModalOpen(false);
      fetchAssignments();
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Assignments Management
          </h1>
          <p className="text-sm text-slate-500">
            Create, edit, and target coursework with OneDrive submission links
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md hover:shadow-glow transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Assignment</span>
        </button>
      </div>

      {/* Assignments Table/Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Published Assignments ({assignments.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
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
                className="p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        assignment.isGlobal
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      {assignment.isGlobal
                        ? 'All Groups'
                        : `Targeted (${assignment.assignmentGroups?.length || 0} Groups)`}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Due {dueDateFormatted}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {assignment.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {assignment.description}
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    <a
                      href={assignment.onedriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
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
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                    title="Edit assignment"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(assignment.id, assignment.title)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Assignment Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Assignment 4: Distributed Consensus Protocols"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Submission Due Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Group Targeting Configuration */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Assignment Scope (Targeting)
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isGlobal: true, groupIds: [] })}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  formData.isGlobal
                    ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🌍 Assign to All Groups</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isGlobal: false })}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  !formData.isGlobal
                    ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🎯 Select Specific Groups</span>
              </button>
            </div>

            {!formData.isGlobal && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 max-h-40 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Check Groups to Assign:
                </div>
                {allGroups.map((g) => {
                  const isChecked = formData.groupIds.includes(g.id);
                  return (
                    <label
                      key={g.id}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleGroupSelection(g.id)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="font-bold">{g.name}</span>
                      <span className="text-slate-400">
                        ({g.members.length} members)
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md transition-all"
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
