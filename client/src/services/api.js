import axios from 'axios';
import { initialMockData } from './mockData';

// Storage key for client-side state
const MOCK_STORAGE_KEY = 'joineazy_state_v1';

const getLocalState = () => {
  try {
    const data = localStorage.getItem(MOCK_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to read from local storage', e);
  }
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initialMockData));
  return initialMockData;
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

// Mock service implementations for seamless testing & fallback
const mockAuth = {
  login: async (email, password) => {
    const state = getLocalState();
    const user = state.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    return { user, token };
  },

  register: async (payload) => {
    const state = getLocalState();
    const existing = state.users.find(
      (u) =>
        u.email.toLowerCase() === payload.email.trim().toLowerCase() ||
        (payload.studentId && u.studentId === payload.studentId.trim())
    );

    if (existing) {
      throw new Error('A user with this email or student ID already exists');
    }

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
    const user = state.users.find((u) => u.id === currentUser.id) || currentUser;
    return user;
  },

  searchStudents: async (query = '') => {
    const state = getLocalState();
    const q = query.toLowerCase().trim();
    return state.users.filter(
      (u) =>
        u.role === 'STUDENT' &&
        (!q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.studentId && u.studentId.toLowerCase().includes(q)))
    );
  },
};

const mockGroups = {
  getMyGroup: async (userId) => {
    const state = getLocalState();
    const group = state.groups.find((g) =>
      g.members.some((m) => m.userId === userId)
    );
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

    const alreadyInGroup = state.groups.some((g) =>
      g.members.some((m) => m.userId === userId)
    );
    if (alreadyInGroup) {
      throw new Error('You are already a member of a group. Leave current group first.');
    }

    const newGroupId = `grp-${Date.now()}`;
    const newGroup = {
      id: newGroupId,
      name: name.trim(),
      code: `GRP-${Math.floor(100 + Math.random() * 900)}`,
      createdById: userId,
      maxMembers: Number(maxMembers) || 5,
      createdAt: new Date().toISOString(),
      members: [
        {
          id: `gm-${Date.now()}`,
          groupId: newGroupId,
          userId: user.id,
          role: 'LEADER',
          joinedAt: new Date().toISOString(),
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            studentId: user.studentId,
          },
        },
      ],
    };

    state.groups.push(newGroup);
    saveLocalState(state);
    return newGroup;
  },

  addMember: async (groupId, identifier, currentUserId) => {
    const state = getLocalState();
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) throw new Error('Group not found');

    if (group.members.length >= group.maxMembers) {
      throw new Error(`Group is already full (max ${group.maxMembers} members)`);
    }

    const targetStudent = state.users.find(
      (u) =>
        u.role === 'STUDENT' &&
        (u.email.toLowerCase() === identifier.trim().toLowerCase() ||
          (u.studentId && u.studentId.toLowerCase() === identifier.trim().toLowerCase()))
    );

    if (!targetStudent) {
      throw new Error(`Student not found matching "${identifier}". Verify email or student ID.`);
    }

    // Check if target is in any group
    const inAnyGroup = state.groups.find((g) =>
      g.members.some((m) => m.userId === targetStudent.id)
    );

    if (inAnyGroup) {
      if (inAnyGroup.id === groupId) {
        throw new Error(`${targetStudent.name} is already in this group.`);
      }
      throw new Error(`${targetStudent.name} is already in group "${inAnyGroup.name}".`);
    }

    const newMember = {
      id: `gm-${Date.now()}`,
      groupId,
      userId: targetStudent.id,
      role: 'MEMBER',
      joinedAt: new Date().toISOString(),
      user: {
        id: targetStudent.id,
        name: targetStudent.name,
        email: targetStudent.email,
        studentId: targetStudent.studentId,
      },
    };

    group.members.push(newMember);
    saveLocalState(state);
    return newMember;
  },

  removeMember: async (groupId, targetUserId, currentUserId) => {
    const state = getLocalState();
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) throw new Error('Group not found');

    group.members = group.members.filter((m) => m.userId !== targetUserId);

    // If group is empty, remove group
    if (group.members.length === 0) {
      state.groups = state.groups.filter((g) => g.id !== groupId);
    } else {
      // Ensure there is at least one leader
      const hasLeader = group.members.some((m) => m.role === 'LEADER');
      if (!hasLeader && group.members.length > 0) {
        group.members[0].role = 'LEADER';
      }
    }

    saveLocalState(state);
    return true;
  },
};

const mockAssignments = {
  getAll: async (user) => {
    const state = getLocalState();
    let studentGroupId = null;
    if (user && user.role === 'STUDENT') {
      const g = state.groups.find((grp) =>
        grp.members.some((m) => m.userId === user.id)
      );
      studentGroupId = g?.id || null;
    }

    return state.assignments
      .filter((a) => {
        if (!user || user.role === 'ADMIN') return true;
        if (a.isGlobal) return true;
        if (!studentGroupId) return false;
        return a.assignmentGroups?.some((ag) => ag.groupId === studentGroupId);
      })
      .map((assignment) => {
        let groupSubmission = null;
        if (studentGroupId) {
          groupSubmission = state.submissions.find(
            (s) => s.assignmentId === assignment.id && s.groupId === studentGroupId
          );
        }

        const isOverdue = new Date(assignment.dueDate) < new Date();
        const submissionStatus = groupSubmission
          ? groupSubmission.confirmed
            ? 'CONFIRMED'
            : 'PENDING_CONFIRMATION'
          : isOverdue
          ? 'OVERDUE'
          : 'NOT_SUBMITTED';

        return {
          ...assignment,
          groupSubmission,
          submissionStatus,
        };
      });
  },

  create: async (payload, adminUser) => {
    const state = getLocalState();
    const newAssignment = {
      id: `asg-${Date.now()}`,
      title: payload.title.trim(),
      description: payload.description.trim(),
      dueDate: payload.dueDate,
      onedriveLink: payload.onedriveLink.trim(),
      isGlobal: Boolean(payload.isGlobal),
      createdById: adminUser?.id || 'admin',
      createdAt: new Date().toISOString(),
      assignmentGroups: payload.isGlobal
        ? []
        : (payload.groupIds || []).map((id) => {
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

    const updated = {
      ...state.assignments[index],
      ...payload,
      assignmentGroups: payload.isGlobal
        ? []
        : (payload.groupIds || []).map((gid) => {
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
    const group = state.groups.find((g) =>
      g.members.some((m) => m.userId === userId)
    );
    if (!group) throw new Error('You must belong to a group to submit assignments.');

    const user = state.users.find((u) => u.id === userId);
    const existingIndex = state.submissions.findIndex(
      (s) => s.assignmentId === assignmentId && s.groupId === group.id
    );

    const submissionData = {
      id: existingIndex >= 0 ? state.submissions[existingIndex].id : `sub-${Date.now()}`,
      assignmentId,
      groupId: group.id,
      submittedById: userId,
      confirmed: true,
      submissionNote: submissionNote || 'Uploaded to OneDrive',
      submittedAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      submittedBy: {
        id: user?.id || userId,
        name: user?.name || 'Student',
        email: user?.email || '',
      },
    };

    if (existingIndex >= 0) {
      state.submissions[existingIndex] = submissionData;
    } else {
      state.submissions.push(submissionData);
    }

    saveLocalState(state);
    return submissionData;
  },

  getMyGroupSubmissions: async (userId) => {
    const state = getLocalState();
    const group = state.groups.find((g) =>
      g.members.some((m) => m.userId === userId)
    );

    if (!group) {
      return { submissions: [], stats: { total: 0, completed: 0, percentage: 0 } };
    }

    const applicableAssignments = state.assignments.filter(
      (a) => a.isGlobal || a.assignmentGroups?.some((ag) => ag.groupId === group.id)
    );

    const submissions = applicableAssignments.map((assignment) => {
      const sub = state.submissions.find(
        (s) => s.assignmentId === assignment.id && s.groupId === group.id
      );
      const isOverdue = new Date(assignment.dueDate) < new Date();

      return {
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        dueDate: assignment.dueDate,
        onedriveLink: assignment.onedriveLink,
        hasSubmitted: Boolean(sub && sub.confirmed),
        submittedAt: sub?.submittedAt || null,
        confirmedAt: sub?.confirmedAt || null,
        submittedBy: sub?.submittedBy || null,
        submissionNote: sub?.submissionNote || null,
        status: sub?.confirmed ? 'CONFIRMED' : isOverdue ? 'OVERDUE' : 'PENDING',
      };
    });

    const total = submissions.length;
    const completed = submissions.filter((s) => s.hasSubmitted).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      submissions,
      stats: { total, completed, percentage },
    };
  },

  getByAssignment: async (assignmentId) => {
    const state = getLocalState();
    const assignment = state.assignments.find((a) => a.id === assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    const targetGroups = assignment.isGlobal
      ? state.groups
      : state.groups.filter((g) =>
          assignment.assignmentGroups?.some((ag) => ag.groupId === g.id)
        );

    const groupStatus = targetGroups.map((group) => {
      const sub = state.submissions.find(
        (s) => s.assignmentId === assignmentId && s.groupId === group.id
      );

      return {
        group: {
          id: group.id,
          name: group.name,
          membersCount: group.members.length,
          members: group.members.map((m) => ({
            ...m.user,
            groupRole: m.role,
          })),
        },
        hasSubmitted: Boolean(sub && sub.confirmed),
        submittedAt: sub?.submittedAt || null,
        confirmedAt: sub?.confirmedAt || null,
        submittedBy: sub?.submittedBy || null,
        submissionNote: sub?.submissionNote || null,
      };
    });

    const totalTargetGroups = groupStatus.length;
    const submittedCount = groupStatus.filter((g) => g.hasSubmitted).length;
    const pendingCount = totalTargetGroups - submittedCount;
    const completionRate =
      totalTargetGroups > 0 ? Math.round((submittedCount / totalTargetGroups) * 100) : 0;

    return {
      assignment,
      stats: { totalTargetGroups, submittedCount, pendingCount, completionRate },
      groupStatus,
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

    const groupPerformance = state.groups.map((g) => {
      const assigned = state.assignments.filter(
        (a) => a.isGlobal || a.assignmentGroups?.some((ag) => ag.groupId === g.id)
      ).length;

      const completed = state.submissions.filter(
        (s) => s.groupId === g.id && s.confirmed
      ).length;

      const rate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

      return {
        id: g.id,
        name: g.name,
        memberCount: g.members.length,
        members: g.members.map((m) => ({ ...m.user, role: m.role })),
        assignedCount: assigned,
        completedCount: completed,
        pendingCount: Math.max(0, assigned - completed),
        completionRate: rate,
      };
    });

    const assignmentStats = state.assignments.map((a) => {
      const targetCount = a.isGlobal
        ? state.groups.length
        : a.assignmentGroups?.length || 0;
      const subCount = state.submissions.filter(
        (s) => s.assignmentId === a.id && s.confirmed
      ).length;
      const rate = targetCount > 0 ? Math.round((subCount / targetCount) * 100) : 0;

      return {
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        isGlobal: a.isGlobal,
        targetGroupCount: targetCount,
        submittedCount: subCount,
        pendingCount: Math.max(0, targetCount - subCount),
        completionRate: rate,
      };
    });

    const totalPotential = state.assignments.reduce(
      (sum, a) =>
        sum + (a.isGlobal ? state.groups.length : a.assignmentGroups?.length || 0),
      0
    );

    const overallRate =
      totalPotential > 0 ? Math.round((totalSubmissions / totalPotential) * 100) : 0;

    const recentSubmissions = [...state.submissions]
      .filter((s) => s.confirmed)
      .sort((a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt))
      .slice(0, 8)
      .map((s) => {
        const asg = state.assignments.find((a) => a.id === s.assignmentId);
        const grp = state.groups.find((g) => g.id === s.groupId);
        return {
          ...s,
          assignment: { id: asg?.id, title: asg?.title || 'Assignment' },
          group: { id: grp?.id, name: grp?.name || 'Group' },
        };
      });

    return {
      summary: {
        totalAssignments,
        totalGroups,
        totalStudents,
        totalSubmissions,
        overallRate,
      },
      groupPerformance,
      assignmentStats,
      recentSubmissions,
    };
  },
};

const isMockSession = () => {
  const token = localStorage.getItem('joineazy_token');
  return Boolean(token && token.startsWith('mock-'));
};

const extractErrorMessage = (e) => {
  if (e.response?.data?.errors && Array.isArray(e.response.data.errors)) {
    return e.response.data.errors
      .map((err) => (err.field ? `${err.field}: ${err.message}` : err.message))
      .join(', ');
  }
  if (e.response?.data?.message) {
    return e.response.data.message;
  }
  return e.message || 'An unexpected error occurred';
};

// Exported high-level API functions with automatic network fallback
export const api = {
  // Auth
  login: async (email, password) => {
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      return res.data.data;
    } catch (e) {
      if (e.response && e.response.status === 401) {
        throw new Error(extractErrorMessage(e));
      }
      console.warn('Using local fallback for login:', e.message);
      return await mockAuth.login(email, password);
    }
  },

  register: async (payload) => {
    try {
      const res = await axiosInstance.post('/auth/register', payload);
      return res.data.data;
    } catch (e) {
      if (e.response && (e.response.status === 400 || e.response.status === 409)) {
        throw new Error(extractErrorMessage(e));
      }
      console.warn('Using local fallback for register:', e.message);
      return await mockAuth.register(payload);
    }
  },

  getMe: async (currentUser) => {
    if (isMockSession()) {
      return await mockAuth.getMe(currentUser);
    }
    try {
      const res = await axiosInstance.get('/auth/me');
      return res.data.data.user;
    } catch (e) {
      return await mockAuth.getMe(currentUser);
    }
  },

  searchStudents: async (query) => {
    if (isMockSession()) {
      return await mockAuth.searchStudents(query);
    }
    try {
      const res = await axiosInstance.get(`/auth/students?query=${encodeURIComponent(query)}`);
      return res.data.data.students;
    } catch (e) {
      return await mockAuth.searchStudents(query);
    }
  },

  // Groups
  getMyGroup: async (userId) => {
    if (isMockSession()) {
      return await mockGroups.getMyGroup(userId);
    }
    try {
      const res = await axiosInstance.get('/groups/my-group');
      return res.data.data;
    } catch (e) {
      return await mockGroups.getMyGroup(userId);
    }
  },

  getAllGroups: async () => {
    if (isMockSession()) {
      return await mockGroups.getAllGroups();
    }
    try {
      const res = await axiosInstance.get('/groups');
      return res.data.data.groups;
    } catch (e) {
      return await mockGroups.getAllGroups();
    }
  },

  createGroup: async (userId, payload) => {
    if (isMockSession()) {
      return await mockGroups.createGroup(userId, payload);
    }
    try {
      const res = await axiosInstance.post('/groups', payload);
      return res.data.data.group;
    } catch (e) {
      if (e.response && e.response.status >= 400 && e.response.status < 500) {
        throw new Error(extractErrorMessage(e));
      }
      return await mockGroups.createGroup(userId, payload);
    }
  },

  addMember: async (groupId, identifier, currentUserId) => {
    if (isMockSession()) {
      return await mockGroups.addMember(groupId, identifier, currentUserId);
    }
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/members`, { identifier });
      return res.data.data.member;
    } catch (e) {
      if (e.response && e.response.status >= 400 && e.response.status < 500) {
        throw new Error(extractErrorMessage(e));
      }
      return await mockGroups.addMember(groupId, identifier, currentUserId);
    }
  },

  removeMember: async (groupId, targetUserId, currentUserId) => {
    if (isMockSession()) {
      return await mockGroups.removeMember(groupId, targetUserId, currentUserId);
    }
    try {
      await axiosInstance.delete(`/groups/${groupId}/members/${targetUserId}`);
      return true;
    } catch (e) {
      if (e.response && e.response.status >= 400 && e.response.status < 500) {
        throw new Error(extractErrorMessage(e));
      }
      return await mockGroups.removeMember(groupId, targetUserId, currentUserId);
    }
  },

  // Assignments
  getAssignments: async (user) => {
    if (isMockSession()) {
      return await mockAssignments.getAll(user);
    }
    try {
      const res = await axiosInstance.get('/assignments');
      return res.data.data.assignments;
    } catch (e) {
      return await mockAssignments.getAll(user);
    }
  },

  createAssignment: async (payload, adminUser) => {
    if (isMockSession()) {
      return await mockAssignments.create(payload, adminUser);
    }
    try {
      const res = await axiosInstance.post('/assignments', payload);
      return res.data.data.assignment;
    } catch (e) {
      if (e.response && e.response.status >= 400 && e.response.status < 500) {
        throw new Error(extractErrorMessage(e));
      }
      return await mockAssignments.create(payload, adminUser);
    }
  },

  updateAssignment: async (id, payload) => {
    if (isMockSession()) {
      return await mockAssignments.update(id, payload);
    }
    try {
      const res = await axiosInstance.put(`/assignments/${id}`, payload);
      return res.data.data.assignment;
    } catch (e) {
      if (e.response && e.response.status >= 400 && e.response.status < 500) {
        throw new Error(extractErrorMessage(e));
      }
      return await mockAssignments.update(id, payload);
    }
  },

  deleteAssignment: async (id) => {
    if (isMockSession()) {
      return await mockAssignments.delete(id);
    }
    try {
      await axiosInstance.delete(`/assignments/${id}`);
      return true;
    } catch (e) {
      if (e.response && e.response.status >= 400 && e.response.status < 500) {
        throw new Error(extractErrorMessage(e));
      }
      return await mockAssignments.delete(id);
    }
  },

  // Submissions
  confirmSubmission: async (userId, payload) => {
    if (isMockSession()) {
      return await mockSubmissions.confirmSubmission(userId, payload);
    }
    try {
      const res = await axiosInstance.post('/submissions/confirm', payload);
      return res.data.data.submission;
    } catch (e) {
      if (e.response && e.response.status >= 400 && e.response.status < 500) {
        throw new Error(extractErrorMessage(e));
      }
      return await mockSubmissions.confirmSubmission(userId, payload);
    }
  },

  getMyGroupSubmissions: async (userId) => {
    if (isMockSession()) {
      return await mockSubmissions.getMyGroupSubmissions(userId);
    }
    try {
      const res = await axiosInstance.get('/submissions/my-group');
      return res.data.data;
    } catch (e) {
      return await mockSubmissions.getMyGroupSubmissions(userId);
    }
  },

  getSubmissionsByAssignment: async (assignmentId) => {
    if (isMockSession()) {
      return await mockSubmissions.getByAssignment(assignmentId);
    }
    try {
      const res = await axiosInstance.get(`/submissions/assignment/${assignmentId}`);
      return res.data.data;
    } catch (e) {
      return await mockSubmissions.getByAssignment(assignmentId);
    }
  },

  // Analytics
  getAnalytics: async () => {
    if (isMockSession()) {
      return await mockAnalytics.getDashboardAnalytics();
    }
    try {
      const res = await axiosInstance.get('/analytics/dashboard');
      return res.data.data;
    } catch (e) {
      return await mockAnalytics.getDashboardAnalytics();
    }
  },

  // Reset demo state helper
  resetDemoState: () => {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initialMockData));
    window.location.reload();
  },
};
