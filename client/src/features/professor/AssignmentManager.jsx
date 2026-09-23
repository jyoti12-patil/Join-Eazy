import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { StatusBadge } from '../../components/StatusBadge';
import { CountdownTimer } from '../../components/CountdownTimer';
import { SkeletonList } from '../../components/SkeletonLoader';
import {
  BookOpen,
  PlusCircle,
  ExternalLink,
  Edit2,
  Trash2,
  Users,
  User,
  Cloud,
  Search,
} from 'lucide-react';

const toLocalInputString = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const AssignmentManager = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [assignments, setAssignments] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL'); // ALL, GROUP, INDIVIDUAL
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, OVERDUE
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    onedriveLink: '',
    submissionType: 'GROUP',
    courseId: '',
    isGlobal: true,
    groupIds: [],
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [asgRes, groupsRes, coursesRes] = await Promise.all([
        api.getAssignments(user),
        api.getAllGroups(),
        api.getCourses(),
      ]);

      setAssignments(asgRes || []);
      setAllGroups(groupsRes || []);
      setCourses(coursesRes || []);
    } catch (err) {
      toast.error('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingAssignment(null);
    const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const dateString = toLocalInputString(defaultDate);

    setFormData({
      title: '',
      description: '',
      dueDate: dateString,
      onedriveLink: 'https://onedrive.live.com/?id=joineazy-',
      submissionType: 'GROUP',
      courseId: courses[0]?.id || '',
      isGlobal: true,
      groupIds: [],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (assignment) => {
    setEditingAssignment(assignment);
    const dateString = toLocalInputString(assignment.dueDate);

    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: dateString,
      onedriveLink: assignment.onedriveLink,
      submissionType: assignment.submissionType || 'GROUP',
      courseId: assignment.courseId || '',
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
    if (formData.submissionType === 'GROUP' && !formData.isGlobal && formData.groupIds.length === 0) {
      toast.error('Please select at least one group for targeted group assignment');
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
        submissionType: formData.submissionType,
        courseId: formData.courseId || null,
        isGlobal: formData.submissionType === 'INDIVIDUAL' ? true : Boolean(formData.isGlobal),
        groupIds: formData.submissionType === 'GROUP' && !formData.isGlobal ? formData.groupIds : [],
      };

      if (editingAssignment) {
        await api.updateAssignment(editingAssignment.id, payload);
        toast.success(`Assignment "${payload.title}" updated!`);
      } else {
        await api.createAssignment(payload, user);
        toast.success(`Assignment "${payload.title}" published!`);
      }

      setModalOpen(false);
      await fetchData();
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
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete assignment');
    }
  };

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // Course filter
      if (selectedCourse !== 'ALL' && a.courseId !== selectedCourse) return false;

      // Submission type filter
      if (selectedType !== 'ALL' && (a.submissionType || 'GROUP') !== selectedType) return false;

      // Status filter
      const isPast = new Date(a.dueDate) < new Date();
      if (statusFilter === 'ACTIVE' && isPast) return false;
      if (statusFilter === 'OVERDUE' && !isPast) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = a.title?.toLowerCase().includes(q);
        const matchesDesc = a.description?.toLowerCase().includes(q);
        const courseName = courses.find((c) => c.id === a.courseId)?.name?.toLowerCase() || '';
        if (!matchesTitle && !matchesDesc && !courseName.includes(q)) return false;
      }

      return true;
    });
  }, [assignments, selectedCourse, selectedType, statusFilter, searchQuery, courses]);

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Assignments Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, manage, and assign coursework across courses and student cohorts
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-500/20 hover:shadow-glow transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Assignment</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assignments by title, description, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Course Filter */}
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">All Courses ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>

            {/* Submission Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">All Types</option>
              <option value="GROUP">👥 Group</option>
              <option value="INDIVIDUAL">👤 Individual</option>
            </select>

            {/* Status Filter */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/60 dark:border-slate-700">
              {['ALL', 'ACTIVE', 'OVERDUE'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === status
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {status === 'ALL' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Past Due'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6">
          <SkeletonList count={4} />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No assignments found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCourse !== 'ALL' || selectedType !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try adjusting your filters or search terms.'
              : 'Post your first assignment to get started.'}
          </p>
        </div>
      ) : (
        /* Assignments Table/Cards */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Assignments ({filteredAssignments.length})
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Showing {filteredAssignments.length} of {assignments.length} total
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredAssignments.map((assignment, index) => {
              const dueDate = new Date(assignment.dueDate);
              const isPast = dueDate < new Date();
              const course = courses.find((c) => c.id === assignment.courseId);
              const isGroup = (assignment.submissionType || 'GROUP') === 'GROUP';

              return (
                <div
                  key={assignment.id}
                  className="p-6 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="space-y-2.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      {course && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-500/20">
                          {course.code}
                        </span>
                      )}

                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${
                          isGroup
                            ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-500/20'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/20'
                        }`}
                      >
                        {isGroup ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {isGroup ? 'Group' : 'Individual'}
                      </span>

                      {isGroup && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {assignment.isGlobal
                            ? 'All Groups'
                            : `Targeted (${assignment.assignmentGroups?.length || 0} Groups)`}
                        </span>
                      )}

                      <CountdownTimer targetDate={assignment.dueDate} compact />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-brand-600 transition-colors">
                      {assignment.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {assignment.description}
                    </p>

                    <div className="flex items-center gap-4 pt-0.5">
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
      )}

      {/* CREATE / EDIT ASSIGNMENT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAssignment ? 'Edit Assignment' : 'Post New Assignment'}
        subtitle="Configure assignment requirements, course association, deadlines, and cohort targets"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
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

          {/* Course Association & Submission Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Associated Course
              </label>
              <select
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">-- Select Course (Optional) --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Submission Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, submissionType: 'GROUP' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.submissionType === 'GROUP'
                      ? 'bg-purple-50 dark:bg-purple-950/70 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Group</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, submissionType: 'INDIVIDUAL' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.submissionType === 'INDIVIDUAL'
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Individual</span>
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Description & Requirements
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail the technical assignment guidelines, expected deliverables, and evaluation criteria..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Date & Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Submission Due Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, onedriveLink: e.target.value })}
                placeholder="https://onedrive.live.com/?id=..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Group Targeting Configuration (Only if GROUP) */}
          {formData.submissionType === 'GROUP' && (
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
                          ({g.members?.length || 0} members)
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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

export default AssignmentManager;
