import axios from 'axios';
import { initialMockData } from './mockData';

// Storage key for client-side state
const MOCK_STORAGE_KEY = 'joineazy_state_v2';

const getLocalState = () => {
  try {
    const data = localStorage.getItem(MOCK_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to read from local storage', e);
  }
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initialMockData));
  return JSON.parse(JSON.stringify(initialMockData));
};

const saveLocalState = (state) => {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save to local storage', e);
  }
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 4000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('joineazy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token is invalid or user no longer exists, clear stale credentials
      if (!error.config?.url?.includes('/auth/login') && !error.config?.url?.includes('/auth/register')) {
        localStorage.removeItem('joineazy_token');
        localStorage.removeItem('joineazy_user');
      }
    }
    return Promise.reject(error);
  }
);

// Mock service implementations
const mockAuth = {
  login: async (email, password) => {
    const state = getLocalState();
    const user = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) throw new Error('Invalid email or password');
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    return { user, token };
  },
  register: async (payload) => {
    const state = getLocalState();
    const existing = state.users.find(
      (u) => u.email.toLowerCase() === payload.email.trim().toLowerCase() ||
        (payload.studentId && u.studentId === payload.studentId.trim())
    );
    if (existing) throw new Error('A user with this email or student ID already exists');
    const newUser = {
      id: `usr-${Date.now()}`,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      studentId: payload.studentId ? payload.studentId.trim() : null,
      role: payload.role || 'STUDENT',
    };
    state.users.push(newUser);
    saveLocalState(state);
    const token = `mock-jwt-token-${newUser.id}-${Date.now()}`;
    return { user: newUser, token };
  },
  getMe: async (currentUser) => {
    if (!currentUser) return null;
    const state = getLocalState();
    return state.users.find((u) => u.id === currentUser.id) || currentUser;
  },
  searchStudents: async (query = '') => {
    const state = getLocalState();
    const q = query.toLowerCase().trim();
    return state.users.filter(
      (u) => u.role === 'STUDENT' && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.studentId && u.studentId.toLowerCase().includes(q)))
    );
  },
};

const mockCourses = {
  getCourses: async (user) => {
    const state = getLocalState();
    let currentUser = user;
    if (!currentUser) {
      try {
        currentUser = JSON.parse(localStorage.getItem('joineazy_user') || 'null');
      } catch (e) {}
    }
    if (!currentUser || currentUser.role === 'ADMIN') {
      const profId = currentUser?.id;
      return state.courses
        .filter((c) => !profId || c.professorId === profId)
        .map((c) => {
          const enrolled = state.courseEnrollments.filter((e) => e.courseId === c.id).length;
          const courseAssignments = state.assignments.filter((a) => a.courseId === c.id);
          const totalSubs = courseAssignments.reduce((sum, a) => {
            return sum + state.submissions.filter((s) => s.assignmentId === a.id && s.confirmed).length;
          }, 0);
          const totalPossible = courseAssignments.length * Math.max(enrolled, 1);
          return {
            ...c,
            _count: { enrollments: enrolled, assignments: courseAssignments.length },
            completionRate: totalPossible > 0 ? Math.round((totalSubs / totalPossible) * 100) : 0,
          };
        });
    }
    return state.courses
      .filter((c) =>
        state.courseEnrollments.some((e) => e.courseId === c.id && e.studentId === currentUser.id)
      )
      .map((c) => {
        const enrolled = state.courseEnrollments.filter((e) => e.courseId === c.id).length;
        const courseAssignments = state.assignments.filter((a) => a.courseId === c.id);
        return {
          ...c,
          _count: { enrollments: enrolled, assignments: courseAssignments.length },
          completionRate: 0,
        };
      });
  },
  getCourseById: async (courseId) => {
    const state = getLocalState();
    const course = state.courses.find((c) => c.id === courseId);
    if (!course) throw new Error('Course not found');
    const enrollments = state.courseEnrollments.filter((e) => e.courseId === courseId).map((e) => ({
      ...e,
      student: state.users.find((u) => u.id === e.studentId),
    }));
    const assignments = state.assignments.filter((a) => a.courseId === courseId);
    return { ...course, enrollments, assignments };
  },
  createCourse: async (payload) => {
    const state = getLocalState();
    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem('joineazy_user') || 'null');
    } catch (e) {}
    const profId = payload.professorId || currentUser?.id || 'usr-prof-1';
    const profUser = state.users.find((u) => u.id === profId) || { id: profId, name: 'Professor', email: '' };

    const newCourse = {
      id: `crs-${Date.now()}`,
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      description: payload.description ? payload.description.trim() : null,
      professorId: profId,
      professor: { id: profUser.id, name: profUser.name, email: profUser.email },
      createdAt: new Date().toISOString(),
      _count: { enrollments: 0, assignments: 0 },
    };
    state.courses.push(newCourse);
    saveLocalState(state);
    return newCourse;
  },
  updateCourse: async (id, payload) => {
    const state = getLocalState();
    const idx = state.courses.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Course not found');
    const updated = {
      ...state.courses[idx],
      ...(payload.name && { name: payload.name.trim() }),
      ...(payload.code && { code: payload.code.trim().toUpperCase() }),
      ...(payload.description !== undefined && { description: payload.description ? payload.description.trim() : null }),
    };
    state.courses[idx] = updated;
    saveLocalState(state);
    return updated;
  },
  deleteCourse: async (id) => {
    const state = getLocalState();
    state.courses = state.courses.filter((c) => c.id !== id);
    state.courseEnrollments = state.courseEnrollments.filter((e) => e.courseId !== id);
    state.assignments = state.assignments.map((a) => a.courseId === id ? { ...a, courseId: null, course: null } : a);
    saveLocalState(state);
    return true;
  },
  getStudentCandidates: async () => {
    const state = getLocalState();
    return state.users.filter((u) => u.role === 'STUDENT').map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      studentId: u.studentId,
    }));
  },
  enrollStudent: async (courseId, identifier) => {
    const state = getLocalState();
    const course = state.courses.find((c) => c.id === courseId);
    if (!course) throw new Error('Course not found');
    const query = (identifier || '').trim().toLowerCase();
    const student = state.users.find(
      (u) =>
        u.role === 'STUDENT' &&
        (u.id === identifier.trim() ||
          u.email.toLowerCase() === query ||
          (u.studentId && u.studentId.toLowerCase() === query))
    );
    if (!student) throw new Error(`Student not found matching "${identifier}". Check email or Student ID.`);
    const alreadyEnrolled = state.courseEnrollments.some(
      (e) => e.courseId === courseId && e.studentId === student.id
    );
    if (alreadyEnrolled) throw new Error(`${student.name} is already enrolled in this course.`);
    const enrollment = {
      id: `enr-${Date.now()}`,
      courseId,
      studentId: student.id,
      student: { id: student.id, name: student.name, email: student.email, studentId: student.studentId },
      enrolledAt: new Date().toISOString(),
    };
    state.courseEnrollments.push(enrollment);
    saveLocalState(state);
    return enrollment;
  },
  unenrollStudent: async (courseId, studentId) => {
    const state = getLocalState();
    state.courseEnrollments = state.courseEnrollments.filter(
      (e) => !(e.courseId === courseId && (e.studentId === studentId || e.student?.id === studentId || e.id === studentId))
    );
    saveLocalState(state);
    return true;
  },
};

const mockGroups = {
  getMyGroup: async (userId) => {
    const state = getLocalState();
    const group = state.groups.find((g) => g.members.some((m) => m.userId === userId));
    if (!group) return { group: null, role: null };
    const memberRecord = group.members.find((m) => m.userId === userId);
    return { group, role: memberRecord ? memberRecord.role : null };
  },
  getAllGroups: async () => {
    const state = getLocalState();
    return state.groups;
  },
  createGroup: async (userId, { name, maxMembers = 5 }) => {
    const state = getLocalState();
    const user = state.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    const alreadyInGroup = state.groups.some((g) => g.members.some((m) => m.userId === userId));
    if (alreadyInGroup) throw new Error('You are already a member of a group. Leave current group first.');
    const newGroupId = `grp-${Date.now()}`;
    const newGroup = {
      id: newGroupId, name: name.trim(), code: `GRP-${Math.floor(100 + Math.random() * 900)}`,
      createdById: userId, maxMembers: Number(maxMembers) || 5, createdAt: new Date().toISOString(),
      members: [{ id: `gm-${Date.now()}`, groupId: newGroupId, userId: user.id, role: 'LEADER', joinedAt: new Date().toISOString(), user: { id: user.id, name: user.name, email: user.email, studentId: user.studentId } }],
    };
    state.groups.push(newGroup);
    saveLocalState(state);
    return newGroup;
  },
  addMember: async (groupId, identifier, currentUserId) => {
    const state = getLocalState();
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) throw new Error('Group not found');
    if (group.members.length >= group.maxMembers) throw new Error(`Group is already full (max ${group.maxMembers} members)`);
    const targetStudent = state.users.find((u) => u.role === 'STUDENT' && (u.email.toLowerCase() === identifier.trim().toLowerCase() || (u.studentId && u.studentId.toLowerCase() === identifier.trim().toLowerCase())));
    if (!targetStudent) throw new Error(`Student not found matching "${identifier}".`);
    const inAnyGroup = state.groups.find((g) => g.members.some((m) => m.userId === targetStudent.id));
    if (inAnyGroup) { if (inAnyGroup.id === groupId) throw new Error(`${targetStudent.name} is already in this group.`); throw new Error(`${targetStudent.name} is already in group "${inAnyGroup.name}".`); }
    const newMember = { id: `gm-${Date.now()}`, groupId, userId: targetStudent.id, role: 'MEMBER', joinedAt: new Date().toISOString(), user: { id: targetStudent.id, name: targetStudent.name, email: targetStudent.email, studentId: targetStudent.studentId } };
    group.members.push(newMember);
    saveLocalState(state);
    return newMember;
  },
  removeMember: async (groupId, targetUserId) => {
    const state = getLocalState();
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) throw new Error('Group not found');
    group.members = group.members.filter((m) => m.userId !== targetUserId);
    if (group.members.length === 0) { state.groups = state.groups.filter((g) => g.id !== groupId); }
    else { const hasLeader = group.members.some((m) => m.role === 'LEADER'); if (!hasLeader) group.members[0].role = 'LEADER'; }
    saveLocalState(state);
    return true;
  },
};

const mockAssignments = {
  getAll: async (user) => {
    const state = getLocalState();
    let studentGroupId = null;
    if (user && user.role === 'STUDENT') {
      const g = state.groups.find((grp) => grp.members.some((m) => m.userId === user.id));
      studentGroupId = g?.id || null;
    }
    return state.assignments.filter((a) => {
      if (!user || user.role === 'ADMIN') return true;
      if (a.isGlobal) return true;
      if (!studentGroupId) return false;
      return a.assignmentGroups?.some((ag) => ag.groupId === studentGroupId);
    }).map((assignment) => {
      let groupSubmission = null;
      let individualSubmission = null;
      if (user && user.role === 'STUDENT') {
        if (assignment.submissionType === 'GROUP' && studentGroupId) {
          groupSubmission = state.submissions.find((s) => s.assignmentId === assignment.id && s.groupId === studentGroupId) || null;
        } else if (assignment.submissionType === 'INDIVIDUAL') {
          individualSubmission = state.submissions.find((s) => s.assignmentId === assignment.id && s.submittedById === user.id && !s.groupId) || null;
        }
      }
      const isOverdue = new Date(assignment.dueDate) < new Date();
      const relevantSub = groupSubmission || individualSubmission;
      return {
        ...assignment,
        groupSubmission, individualSubmission,
        submissionStatus: relevantSub ? (relevantSub.confirmed ? 'CONFIRMED' : 'PENDING_CONFIRMATION') : isOverdue ? 'OVERDUE' : 'NOT_SUBMITTED',
      };
    });
  },
  create: async (payload, adminUser) => {
    const state = getLocalState();
    const course = payload.courseId ? state.courses.find((c) => c.id === payload.courseId) : null;
    const newAssignment = {
      id: `asg-${Date.now()}`, title: payload.title.trim(), description: payload.description.trim(),
      dueDate: payload.dueDate, onedriveLink: payload.onedriveLink.trim(),
      isGlobal: Boolean(payload.isGlobal), submissionType: payload.submissionType || 'GROUP',
      courseId: payload.courseId || null,
      course: course ? { id: course.id, name: course.name, code: course.code } : null,
      createdById: adminUser?.id || 'admin', createdAt: new Date().toISOString(),
      assignmentGroups: payload.isGlobal ? [] : (payload.groupIds || []).map((id) => {
        const grp = state.groups.find((g) => g.id === id);
        return { groupId: id, groupName: grp?.name || 'Group' };
      }),
    };
    state.assignments.unshift(newAssignment);
    saveLocalState(state);
    return newAssignment;
  },
  update: async (id, payload) => {
    const state = getLocalState();
    const index = state.assignments.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Assignment not found');
    const course = payload.courseId ? state.courses.find((c) => c.id === payload.courseId) : null;
    const updated = {
      ...state.assignments[index], ...payload,
      course: course ? { id: course.id, name: course.name, code: course.code } : state.assignments[index].course,
      assignmentGroups: payload.isGlobal ? [] : (payload.groupIds || []).map((gid) => {
        const grp = state.groups.find((g) => g.id === gid);
        return { groupId: gid, groupName: grp?.name || 'Group' };
      }),
    };
    state.assignments[index] = updated;
    saveLocalState(state);
    return updated;
  },
  delete: async (id) => {
    const state = getLocalState();
    state.assignments = state.assignments.filter((a) => a.id !== id);
    state.submissions = state.submissions.filter((s) => s.assignmentId !== id);
    saveLocalState(state);
    return true;
  },
};

const mockSubmissions = {
  confirmSubmission: async (userId, { assignmentId, confirmed, submissionNote }) => {
    const state = getLocalState();
    const assignment = state.assignments.find((a) => a.id === assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    // INDIVIDUAL submission
    if (assignment.submissionType === 'INDIVIDUAL') {
      const user = state.users.find((u) => u.id === userId);
      const existingIndex = state.submissions.findIndex((s) => s.assignmentId === assignmentId && s.submittedById === userId && !s.groupId);
      const submissionData = {
        id: existingIndex >= 0 ? state.submissions[existingIndex].id : `sub-${Date.now()}`,
        assignmentId, groupId: null, submittedById: userId, confirmed: true,
        acknowledgedByLeader: false, submissionNote: submissionNote || 'Submitted individually',
        submittedAt: new Date().toISOString(), confirmedAt: new Date().toISOString(), leaderAcknowledgedAt: null,
        submittedBy: { id: user?.id || userId, name: user?.name || 'Student', email: user?.email || '' },
      };
      if (existingIndex >= 0) state.submissions[existingIndex] = submissionData;
      else state.submissions.push(submissionData);
      saveLocalState(state);
      return submissionData;
    }

    // GROUP submission — leader only
    const group = state.groups.find((g) => g.members.some((m) => m.userId === userId));
    if (!group) throw new Error('You must belong to a group to submit group assignments.');
    const membership = group.members.find((m) => m.userId === userId);
    if (membership.role !== 'LEADER') throw new Error('Only the group leader can submit and acknowledge group assignments.');

    const user = state.users.find((u) => u.id === userId);
    const existingIndex = state.submissions.findIndex((s) => s.assignmentId === assignmentId && s.groupId === group.id);
    const submissionData = {
      id: existingIndex >= 0 ? state.submissions[existingIndex].id : `sub-${Date.now()}`,
      assignmentId, groupId: group.id, submittedById: userId, confirmed: true,
      acknowledgedByLeader: true, submissionNote: submissionNote || 'Uploaded to OneDrive',
      submittedAt: new Date().toISOString(), confirmedAt: new Date().toISOString(), leaderAcknowledgedAt: new Date().toISOString(),
      submittedBy: { id: user?.id || userId, name: user?.name || 'Student', email: user?.email || '' },
    };
    if (existingIndex >= 0) state.submissions[existingIndex] = submissionData;
    else state.submissions.push(submissionData);
    saveLocalState(state);
    return submissionData;
  },
  getMyGroupSubmissions: async (userId) => {
    const state = getLocalState();
    const group = state.groups.find((g) => g.members.some((m) => m.userId === userId));
    const applicableAssignments = state.assignments.filter((a) =>
      a.isGlobal || (group && a.assignmentGroups?.some((ag) => ag.groupId === group?.id))
    );
    const submissions = applicableAssignments.map((assignment) => {
      let sub = null;
      if (assignment.submissionType === 'GROUP' && group) {
        sub = state.submissions.find((s) => s.assignmentId === assignment.id && s.groupId === group.id) || null;
      } else if (assignment.submissionType === 'INDIVIDUAL') {
        sub = state.submissions.find((s) => s.assignmentId === assignment.id && s.submittedById === userId && !s.groupId) || null;
      }
      const isOverdue = new Date(assignment.dueDate) < new Date();
      return {
        assignmentId: assignment.id, assignmentTitle: assignment.title, dueDate: assignment.dueDate,
        onedriveLink: assignment.onedriveLink, submissionType: assignment.submissionType,
        course: assignment.course,
        hasSubmitted: Boolean(sub && sub.confirmed), acknowledgedByLeader: Boolean(sub && sub.acknowledgedByLeader),
        submittedAt: sub?.submittedAt || null, confirmedAt: sub?.confirmedAt || null,
        submittedBy: sub?.submittedBy || null, submissionNote: sub?.submissionNote || null,
        submissionId: sub?.id || null,
        grade: sub?.grade ?? null,
        feedback: sub?.feedback ?? null,
        gradedAt: sub?.gradedAt || null,
        status: sub?.confirmed ? 'CONFIRMED' : isOverdue ? 'OVERDUE' : 'PENDING',
      };
    });
    const total = submissions.length;
    const completed = submissions.filter((s) => s.hasSubmitted).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { submissions, stats: { total, completed, percentage } };
  },
  gradeSubmission: async ({ submissionId, assignmentId, groupId, studentId, grade, feedback }) => {
    const state = getLocalState();
    let subIndex = -1;
    if (submissionId) {
      subIndex = state.submissions.findIndex((s) => s.id === submissionId);
    }
    if (subIndex === -1 && assignmentId) {
      if (groupId) {
        subIndex = state.submissions.findIndex((s) => s.assignmentId === assignmentId && s.groupId === groupId);
      } else if (studentId) {
        subIndex = state.submissions.findIndex((s) => s.assignmentId === assignmentId && s.submittedById === studentId && !s.groupId);
      }
    }

    const numericGrade = grade !== undefined && grade !== null && grade !== '' ? Number(grade) : null;
    const cleanFeedback = feedback ? feedback.trim() : null;

    if (subIndex >= 0) {
      state.submissions[subIndex] = {
        ...state.submissions[subIndex],
        grade: numericGrade,
        feedback: cleanFeedback,
        gradedAt: new Date().toISOString(),
      };
      saveLocalState(state);
      return state.submissions[subIndex];
    } else {
      const newSub = {
        id: `sub-${Date.now()}`,
        assignmentId,
        groupId: groupId || null,
        submittedById: studentId || 'admin',
        confirmed: true,
        confirmedAt: new Date().toISOString(),
        grade: numericGrade,
        feedback: cleanFeedback,
        gradedAt: new Date().toISOString(),
      };
      state.submissions.push(newSub);
      saveLocalState(state);
      return newSub;
    }
  },
  getByAssignment: async (assignmentId) => {
    const state = getLocalState();
    const assignment = state.assignments.find((a) => a.id === assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    if (assignment.submissionType === 'INDIVIDUAL') {
      let targetStudents = [];
      if (assignment.courseId) {
        const enrolledIds = state.courseEnrollments
          .filter((e) => e.courseId === assignment.courseId)
          .map((e) => e.studentId);
        targetStudents = state.users.filter((u) => u.role === 'STUDENT' && enrolledIds.includes(u.id));
      } else {
        targetStudents = state.users.filter((u) => u.role === 'STUDENT');
      }

      const studentStatus = targetStudents.map((student) => {
        const sub = state.submissions.find(
          (s) => s.assignmentId === assignmentId && s.submittedById === student.id && !s.groupId
        );
        return {
          student,
          hasSubmitted: Boolean(sub && sub.confirmed),
          submittedAt: sub?.submittedAt || null,
          confirmedAt: sub?.confirmedAt || null,
          submissionNote: sub?.submissionNote || null,
          submissionId: sub?.id || null,
          grade: sub?.grade ?? null,
          feedback: sub?.feedback ?? null,
          gradedAt: sub?.gradedAt || null,
        };
      });

      const totalTarget = studentStatus.length;
      const submittedCount = studentStatus.filter((s) => s.hasSubmitted).length;
      const pendingCount = Math.max(0, totalTarget - submittedCount);
      const completionRate = totalTarget > 0 ? Math.round((submittedCount / totalTarget) * 100) : 0;

      return {
        assignment,
        stats: {
          totalTargetGroups: totalTarget,
          totalTarget,
          submittedCount,
          pendingCount,
          completionRate,
          totalSubmissions: submittedCount,
          confirmedCount: submittedCount,
        },
        studentStatus,
        individualSubmissions: studentStatus.filter((s) => s.hasSubmitted),
        groupStatus: [],
      };
    }

    const targetGroups = assignment.isGlobal
      ? state.groups
      : state.groups.filter((g) => assignment.assignmentGroups?.some((ag) => ag.groupId === g.id));
    const groupStatus = targetGroups.map((group) => {
      const sub = state.submissions.find((s) => s.assignmentId === assignmentId && s.groupId === group.id);
      return {
        group: { id: group.id, name: group.name, membersCount: group.members.length, members: group.members.map((m) => ({ ...m.user, groupRole: m.role })) },
        hasSubmitted: Boolean(sub && sub.confirmed), acknowledgedByLeader: Boolean(sub && sub.acknowledgedByLeader),
        submittedAt: sub?.submittedAt || null, confirmedAt: sub?.confirmedAt || null,
        leaderAcknowledgedAt: sub?.leaderAcknowledgedAt || null,
        submittedBy: sub?.submittedBy || null, submissionNote: sub?.submissionNote || null,
        submissionId: sub?.id || null,
        grade: sub?.grade ?? null,
        feedback: sub?.feedback ?? null,
        gradedAt: sub?.gradedAt || null,
      };
    });
    const totalTargetGroups = groupStatus.length;
    const submittedCount = groupStatus.filter((g) => g.hasSubmitted).length;
    return {
      assignment,
      stats: {
        totalTargetGroups,
        totalTarget: totalTargetGroups,
        submittedCount,
        pendingCount: Math.max(0, totalTargetGroups - submittedCount),
        completionRate: totalTargetGroups > 0 ? Math.round((submittedCount / totalTargetGroups) * 100) : 0,
      },
      groupStatus,
      studentStatus: [],
    };
  },
};

const mockAnalytics = {
  getDashboardAnalytics: async () => {
    const state = getLocalState();
    const totalAssignments = state.assignments.length;
    const totalGroups = state.groups.length;
    const totalStudents = state.users.filter((u) => u.role === 'STUDENT').length;
    const totalSubmissions = state.submissions.filter((s) => s.confirmed).length;
    const totalCourses = state.courses.length;

    const groupPerformance = state.groups.map((g) => {
      const assigned = state.assignments.filter((a) => a.submissionType === 'GROUP' && (a.isGlobal || a.assignmentGroups?.some((ag) => ag.groupId === g.id))).length;
      const completed = state.submissions.filter((s) => s.groupId === g.id && s.confirmed).length;
      const rate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
      return { id: g.id, name: g.name, memberCount: g.members.length, members: g.members.map((m) => ({ ...m.user, role: m.role })), assignedCount: assigned, completedCount: completed, pendingCount: Math.max(0, assigned - completed), completionRate: rate };
    });

    const assignmentStats = state.assignments.map((a) => {
      const targetCount = a.submissionType === 'GROUP' ? (a.isGlobal ? state.groups.length : a.assignmentGroups?.length || 0) : totalStudents;
      const subCount = state.submissions.filter((s) => s.assignmentId === a.id && s.confirmed).length;
      const rate = targetCount > 0 ? Math.round((subCount / targetCount) * 100) : 0;
      return { id: a.id, title: a.title, dueDate: a.dueDate, isGlobal: a.isGlobal, submissionType: a.submissionType, course: a.course, targetGroupCount: targetCount, submittedCount: subCount, pendingCount: Math.max(0, targetCount - subCount), completionRate: rate };
    });

    const courseStats = state.courses.map((c) => {
      const enrolled = state.courseEnrollments.filter((e) => e.courseId === c.id).length;
      const courseAssignments = state.assignments.filter((a) => a.courseId === c.id);
      const subs = courseAssignments.reduce((sum, a) => sum + state.submissions.filter((s) => s.assignmentId === a.id && s.confirmed).length, 0);
      const totalPossible = courseAssignments.length * Math.max(enrolled, 1);
      return { id: c.id, name: c.name, code: c.code, enrolledCount: enrolled, assignmentCount: courseAssignments.length, submissionCount: subs, completionRate: totalPossible > 0 ? Math.round((subs / totalPossible) * 100) : 0 };
    });

    const recentSubmissions = [...state.submissions].filter((s) => s.confirmed).sort((a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt)).slice(0, 8).map((s) => {
      const asg = state.assignments.find((a) => a.id === s.assignmentId);
      const grp = s.groupId ? state.groups.find((g) => g.id === s.groupId) : null;
      return { ...s, assignment: { id: asg?.id, title: asg?.title || 'Assignment' }, group: grp ? { id: grp.id, name: grp.name } : null };
    });

    const totalPotential = state.assignments.reduce((sum, a) => sum + (a.isGlobal ? state.groups.length : a.assignmentGroups?.length || 0), 0);
    const overallRate = totalPotential > 0 ? Math.round((totalSubmissions / totalPotential) * 100) : 0;

    return {
      summary: { totalAssignments, totalGroups, totalStudents, totalSubmissions, totalCourses, overallRate },
      groupPerformance, assignmentStats, courseStats, recentSubmissions,
    };
  },
};

const isMockSession = () => {
  const token = localStorage.getItem('joineazy_token');
  return Boolean(token && token.startsWith('mock-'));
};

const extractErrorMessage = (e) => {
  if (e.response?.data?.errors && Array.isArray(e.response.data.errors)) {
    return e.response.data.errors.map((err) => (err.field ? `${err.field}: ${err.message}` : err.message)).join(', ');
  }
  if (e.response?.data?.message) return e.response.data.message;
  return e.message || 'An unexpected error occurred';
};

// Exported high-level API functions with automatic network fallback
export const api = {
  // Auth
  login: async (email, password) => {
    try { const res = await axiosInstance.post('/auth/login', { email, password }); return res.data.data; }
    catch (e) { if (e.response && e.response.status === 401) throw new Error(extractErrorMessage(e)); console.warn('Using local fallback for login:', e.message); return await mockAuth.login(email, password); }
  },
  register: async (payload) => {
    try { const res = await axiosInstance.post('/auth/register', payload); return res.data.data; }
    catch (e) { if (e.response && (e.response.status === 400 || e.response.status === 409)) throw new Error(extractErrorMessage(e)); return await mockAuth.register(payload); }
  },
  getMe: async (currentUser) => {
    if (isMockSession()) return await mockAuth.getMe(currentUser);
    try { 
      const res = await axiosInstance.get('/auth/me'); 
      return res.data.data.user; 
    } catch (e) { 
      if (e.response && e.response.status === 401) throw e;
      return await mockAuth.getMe(currentUser); 
    }
  },
  searchStudents: async (query) => {
    if (isMockSession()) return await mockAuth.searchStudents(query);
    try { const res = await axiosInstance.get(`/auth/students?query=${encodeURIComponent(query)}`); return res.data.data.students; }
    catch (e) { return await mockAuth.searchStudents(query); }
  },

  // Courses
  getCourses: async (user) => {
    let currentUser = user;
    if (!currentUser) {
      try { currentUser = JSON.parse(localStorage.getItem('joineazy_user') || 'null'); } catch (e) {}
    }
    if (isMockSession()) return await mockCourses.getCourses(currentUser);
    try { const res = await axiosInstance.get('/courses'); return res.data.data.courses; }
    catch (e) { return await mockCourses.getCourses(currentUser); }
  },
  getCourseById: async (courseId) => {
    if (isMockSession()) return await mockCourses.getCourseById(courseId);
    try { const res = await axiosInstance.get(`/courses/${courseId}`); return res.data.data.course; }
    catch (e) { return await mockCourses.getCourseById(courseId); }
  },
  createCourse: async (payload) => {
    if (isMockSession()) return await mockCourses.createCourse(payload);
    try { const res = await axiosInstance.post('/courses', payload); return res.data.data.course; }
    catch (e) { if (e.response && e.response.status >= 400 && e.response.status < 500) throw new Error(extractErrorMessage(e)); return await mockCourses.createCourse(payload); }
  },
  updateCourse: async (id, payload) => {
    if (isMockSession()) return await mockCourses.updateCourse(id, payload);
    try { const res = await axiosInstance.put(`/courses/${id}`, payload); return res.data.data.course; }
    catch (e) { if (e.response && e.response.status >= 400 && e.response.status < 500) throw new Error(extractErrorMessage(e)); return await mockCourses.updateCourse(id, payload); }
  },
  deleteCourse: async (id) => {
    if (isMockSession()) return await mockCourses.deleteCourse(id);
    try { await axiosInstance.delete(`/courses/${id}`); return true; }
    catch (e) { if (e.response && e.response.status >= 400 && e.response.status < 500) throw new Error(extractErrorMessage(e)); return await mockCourses.deleteCourse(id); }
  },
  enrollStudent: async (courseId, studentId) => {
    if (isMockSession()) return await mockCourses.enrollStudent(courseId, studentId);
    try { const res = await axiosInstance.post(`/courses/${courseId}/enroll`, { studentId }); return res.data.data.enrollment; }
    catch (e) { if (e.response && e.response.status >= 400 && e.response.status < 500) throw new Error(extractErrorMessage(e)); return await mockCourses.enrollStudent(courseId, studentId); }
  },
  unenrollStudent: async (courseId, studentId) => {
    if (isMockSession()) return await mockCourses.unenrollStudent(courseId, studentId);
    try { await axiosInstance.delete(`/courses/${courseId}/enroll/${studentId}`); return true; }
    catch (e) { if (e.response && e.response.status >= 400 && e.response.status < 500) throw new Error(extractErrorMessage(e)); return await mockCourses.unenrollStudent(courseId, studentId); }
  },
  getStudentCandidates: async () => {
    if (isMockSession()) return await mockCourses.getStudentCandidates();
    try { const res = await axiosInstance.get('/courses/students/candidates'); return res.data.data.students; }
    catch (e) { return await mockCourses.getStudentCandidates(); }
  },

  // Groups
  getMyGroup: async (userId) => {
    let currentUserId = userId;
    if (!currentUserId) {
      try { currentUserId = JSON.parse(localStorage.getItem('joineazy_user') || 'null')?.id; } catch (e) {}
    }
    if (isMockSession()) return await mockGroups.getMyGroup(currentUserId);
    try { const res = await axiosInstance.get('/groups/my-group'); return res.data.data; }
    catch (e) { return await mockGroups.getMyGroup(currentUserId); }
  },
  getAllGroups: async () => {
    if (isMockSession()) return await mockGroups.getAllGroups();
    try { const res = await axiosInstance.get('/groups'); return res.data.data.groups; }
    catch (e) { return await mockGroups.getAllGroups(); }
  },
  createGroup: async (userId, payload) => {
    if (isMockSession()) return await mockGroups.createGroup(userId, payload);
    try { const res = await axiosInstance.post('/groups', payload); return res.data.data.group; }
    catch (e) { if (e.response && e.response.status >= 400 && e.response.status < 500) throw new Error(extractErrorMessage(e)); return await mockGroups.createGroup(userId, payload); }
  },
  addMember: async (groupId, identifier, currentUserId) => {
    if (isMockSession()) return await mockGroups.addMember(groupId, identifier, currentUserId);
    try { const res = await axiosInstance.post(`/groups/${groupId}/members`, { identifier }); return res.data.data.member; }
    catch (e) { if (e.response && e.response.status >= 400 && e.response.status < 500) throw new Error(extractErrorMessage(e)); return await mockGroups.addMember(groupId, identifier, currentUserId); }
  },
  removeMember: async (groupId, targetUserId, currentUserId) => {
    if (isMockSession()) return await mockGroups.removeMember(groupId, targetUserId);
    try { await axiosInstance.delete(`/groups/${groupId}/members/${targetUserId}`); return true; }
    catch (e) { if (e.response && e.response.status >= 400 && e.response.status < 500) throw new Error(extractErrorMessage(e)); return await mockGroups.removeMember(groupId, targetUserId); }
  },

  // Assignments
  getAssignments: async (user) => {
    let currentUser = user;
    if (!currentUser) {
      try { currentUser = JSON.parse(localStorage.getItem('joineazy_user') || 'null'); } catch (e) {}
    }
    if (isMockSession()) return await mockAssignments.getAll(currentUser);
    try { const res = await axiosInstance.get('/assignments'); return res.data.data.assignments; }
    catch (e) { return await mockAssignments.getAll(currentUser); }
  },
  createAssignment: async (payload, adminUser) => {
    if (isMockSession()) return await mockAssignments.create(payload, adminUser);
    try { const res = await axiosInstance.post('/assignments', payload); return res.data.data.assignment; }
    catch (e) { if (e.response && e.response.status >= 400 && e.response.status < 500) throw new Error(extractErrorMessage(e)); return await mockAssignments.create(payload, adminUser); }
  },
  updateAssignment: async (id, payload) => {
    if (isMockSession()) return await mockAssignments.update(id, payload);
    try { const res = await axiosInstance.put(`/assignments/${id}`, payload); return res.data.data.assignment; }
    catch (e) { if (e.response && e.response.status >= 400 && e.response.status < 500) throw new Error(extractErrorMessage(e)); return await mockAssignments.update(id, payload); }
  },
  deleteAssignment: async (id) => {
    if (isMockSession()) return await mockAssignments.delete(id);
    try { await axiosInstance.delete(`/assignments/${id}`); return true; }
    catch (e) { if (e.response && e.response.status >= 400 && e.response.status < 500) throw new Error(extractErrorMessage(e)); return await mockAssignments.delete(id); }
  },

  // Submissions
  confirmSubmission: async (userId, payload) => {
    let currentUserId = userId;
    if (!currentUserId) {
      try { currentUserId = JSON.parse(localStorage.getItem('joineazy_user') || 'null')?.id; } catch (e) {}
    }
    if (isMockSession()) return await mockSubmissions.confirmSubmission(currentUserId, payload);
    try { const res = await axiosInstance.post('/submissions/confirm', payload); return res.data.data.submission; }
    catch (e) { if (e.response && e.response.status >= 400 && e.response.status < 500) throw new Error(extractErrorMessage(e)); return await mockSubmissions.confirmSubmission(currentUserId, payload); }
  },
  getMyGroupSubmissions: async (userId) => {
    let currentUserId = userId;
    if (!currentUserId) {
      try { currentUserId = JSON.parse(localStorage.getItem('joineazy_user') || 'null')?.id; } catch (e) {}
    }
    if (isMockSession()) return await mockSubmissions.getMyGroupSubmissions(currentUserId);
    try { const res = await axiosInstance.get('/submissions/my-group'); return res.data.data; }
    catch (e) { return await mockSubmissions.getMyGroupSubmissions(currentUserId); }
  },
  getSubmissionsByAssignment: async (assignmentId) => {
    if (isMockSession()) return await mockSubmissions.getByAssignment(assignmentId);
    try { const res = await axiosInstance.get(`/submissions/assignment/${assignmentId}`); return res.data.data; }
    catch (e) { return await mockSubmissions.getByAssignment(assignmentId); }
  },
  gradeSubmission: async (submissionId, payload) => {
    if (isMockSession()) return await mockSubmissions.gradeSubmission({ submissionId, ...payload });
    try {
      if (submissionId) {
        const res = await axiosInstance.put(`/submissions/${submissionId}/grade`, payload);
        return res.data.data.submission;
      } else {
        const res = await axiosInstance.post('/submissions/grade', payload);
        return res.data.data.submission;
      }
    } catch (e) {
      if (e.response && e.response.status >= 400 && e.response.status < 500) throw new Error(extractErrorMessage(e));
      return await mockSubmissions.gradeSubmission({ submissionId, ...payload });
    }
  },

  // Analytics
  getAnalytics: async () => {
    if (isMockSession()) return await mockAnalytics.getDashboardAnalytics();
    try { const res = await axiosInstance.get('/analytics/dashboard'); return res.data.data; }
    catch (e) { return await mockAnalytics.getDashboardAnalytics(); }
  },

  // Reset demo state helper
  resetDemoState: () => {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initialMockData));
    window.location.reload();
  },
};
