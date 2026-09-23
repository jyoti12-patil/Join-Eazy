import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Modal } from './Modal';
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  Mail,
  GraduationCap,
  CheckCircle,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react';

export const CourseRosterModal = ({ isOpen, onClose, course, onRosterUpdated }) => {
  const toast = useToast();

  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [studentInput, setStudentInput] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const fetchRosterData = async () => {
    if (!course?.id) return;
    setLoading(true);
    try {
      const [courseData, candidateList] = await Promise.all([
        api.getCourseById(course.id),
        api.getStudentCandidates(),
      ]);

      const enrollments = courseData?.enrollments || [];
      const students = enrollments.map((e) => ({
        enrollmentId: e.id,
        id: e.student?.id || e.studentId,
        name: e.student?.name || 'Student',
        email: e.student?.email || '',
        studentId: e.student?.studentId || null,
        enrolledAt: e.enrolledAt,
      }));

      setEnrolledStudents(students);
      setCandidates(candidateList || []);
    } catch (err) {
      toast.error('Failed to load course roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && course) {
      setStudentInput('');
      setSearchFilter('');
      fetchRosterData();
    }
  }, [isOpen, course]);

  // Candidates not already enrolled
  const enrolledIds = useMemo(() => new Set(enrolledStudents.map((s) => s.id)), [enrolledStudents]);

  const candidateSuggestions = useMemo(() => {
    const q = studentInput.trim().toLowerCase();
    if (!q) return [];
    return candidates
      .filter((c) => !enrolledIds.has(c.id))
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.studentId && c.studentId.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [candidates, enrolledIds, studentInput]);

  // Filtered enrolled students
  const filteredEnrolled = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return enrolledStudents;
    return enrolledStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.studentId && s.studentId.toLowerCase().includes(q))
    );
  }, [enrolledStudents, searchFilter]);

  const handleEnroll = async (identifierToEnroll) => {
    let target = (identifierToEnroll || studentInput).trim();
    if (!target) {
      toast.error('Please enter a student name, email, or Student ID');
      return;
    }

    if (!identifierToEnroll) {
      // If entered manually, check if it matches a candidate
      const match = candidates.find(
        (c) =>
          !enrolledIds.has(c.id) &&
          (c.name.toLowerCase() === target.toLowerCase() ||
           c.email.toLowerCase() === target.toLowerCase() ||
           (c.studentId && c.studentId.toLowerCase() === target.toLowerCase()))
      ) || (candidateSuggestions.length === 1 ? candidateSuggestions[0] : null);

      if (match) {
        target = match.email || match.id;
      }
    }

    setEnrolling(true);
    try {
      await api.enrollStudent(course.id, target);
      toast.success('Student enrolled successfully');
      setStudentInput('');
      await fetchRosterData();
      if (onRosterUpdated) onRosterUpdated();
    } catch (err) {
      toast.error(err.message || 'Failed to enroll student');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async (student) => {
    if (!window.confirm(`Are you sure you want to remove ${student.name} from ${course.name}?`)) {
      return;
    }

    setRemovingId(student.id);
    try {
      await api.unenrollStudent(course.id, student.id);
      toast.success(`${student.name} removed from course`);
      await fetchRosterData();
      if (onRosterUpdated) onRosterUpdated();
    } catch (err) {
      toast.error(err.message || 'Failed to remove student');
    } finally {
      setRemovingId(null);
    }
  };

  if (!course) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Course Roster: ${course.name}`}
      subtitle={`${course.code} • ${enrolledStudents.length} Students Enrolled`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* ENROLL SECTION */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <UserPlus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Enroll New Student</span>
          </div>

          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleEnroll();
                    }
                  }}
                  placeholder="Type student name, email, or Student ID (e.g. STU-1002)..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 placeholder:text-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={() => handleEnroll()}
                disabled={enrolling || !studentInput.trim()}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {enrolling ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                <span>{enrolling ? 'Enrolling...' : 'Enroll'}</span>
              </button>
            </div>

            {/* Candidate Autocomplete Suggestions */}
            {candidateSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {candidateSuggestions.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => handleEnroll(candidate.email || candidate.id)}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                        {candidate.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{candidate.name}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          {candidate.email} {candidate.studentId && `• ${candidate.studentId}`}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded border border-brand-200/50 dark:border-brand-800/50">
                      Click to Enroll
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ROSTER LIST SECTION */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Enrolled Students ({filteredEnrolled.length})</span>
            </div>

            {enrolledStudents.length > 5 && (
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter enrolled..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 placeholder:text-slate-400"
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" />
              <span className="text-xs text-slate-400 mt-2 block">Loading course roster...</span>
            </div>
          ) : filteredEnrolled.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {searchFilter ? 'No matching enrolled students found' : 'No students are currently enrolled in this course.'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Use the search input above to enroll students.
              </p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEnrolled.map((student) => {
                const isRemoving = removingId === student.id;
                const enrolledDateFormatted = student.enrolledAt
                  ? new Date(student.enrolledAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : null;

                return (
                  <div
                    key={student.id}
                    className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {student.name}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          {student.email} {student.studentId && `• ${student.studentId}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {enrolledDateFormatted && (
                        <span className="hidden sm:inline-block text-[11px] text-slate-400 dark:text-slate-500">
                          Joined {enrolledDateFormatted}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleUnenroll(student)}
                        disabled={isRemoving}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Remove student from course"
                      >
                        {isRemoving ? (
                          <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl cursor-pointer"
          >
            Close Roster
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CourseRosterModal;
