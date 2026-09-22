import prisma from '../config/db.js';

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const [
      totalAssignments,
      totalGroups,
      totalStudents,
      totalSubmissions,
      totalCourses,
      groups,
      assignments,
      recentSubmissions,
      courses,
    ] = await Promise.all([
      prisma.assignment.count(),
      prisma.group.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.submission.count({ where: { confirmed: true } }),
      prisma.course.count(),
      prisma.group.findMany({
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, studentId: true },
              },
            },
          },
          submissions: {
            where: { confirmed: true },
            select: { assignmentId: true, confirmedAt: true },
          },
          assignmentGroups: {
            select: { assignmentId: true },
          },
        },
      }),
      prisma.assignment.findMany({
        include: {
          assignmentGroups: true,
          course: {
            select: { id: true, name: true, code: true },
          },
          submissions: {
            where: { confirmed: true },
            include: {
              group: { select: { id: true, name: true } },
              submittedBy: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.submission.findMany({
        where: { confirmed: true },
        include: {
          assignment: { select: { id: true, title: true } },
          group: { select: { id: true, name: true } },
          submittedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { confirmedAt: 'desc' },
        take: 10,
      }),
      prisma.course.findMany({
        include: {
          _count: { select: { enrollments: true, assignments: true } },
          assignments: {
            include: {
              submissions: {
                where: { confirmed: true },
                select: { id: true },
              },
            },
          },
        },
      }),
    ]);

    // Calculate group performance breakdown
    const groupPerformance = groups.map((g) => {
      const assignedCount = assignments.filter(
        (a) => a.isGlobal || a.assignmentGroups.some((ag) => ag.groupId === g.id)
      ).length;

      const completedCount = g.submissions.length;
      const rate = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

      return {
        id: g.id,
        name: g.name,
        memberCount: g.members.length,
        members: g.members.map((m) => ({
          ...m.user,
          role: m.role,
        })),
        assignedCount,
        completedCount,
        pendingCount: Math.max(0, assignedCount - completedCount),
        completionRate: rate,
      };
    });

    // Calculate assignment completion breakdown
    const assignmentStats = assignments.map((a) => {
      const targetGroupCount =
        a.submissionType === 'INDIVIDUAL'
          ? totalStudents
          : a.isGlobal
          ? groups.length
          : a.assignmentGroups.length;
      const submittedCount = a.submissions.length;
      const rate = targetGroupCount > 0 ? Math.round((submittedCount / targetGroupCount) * 100) : 0;

      return {
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        isGlobal: a.isGlobal,
        submissionType: a.submissionType,
        course: a.course,
        targetGroupCount,
        submittedCount,
        pendingCount: Math.max(0, targetGroupCount - submittedCount),
        completionRate: rate,
      };
    });

    // Course-level analytics
    const courseStats = courses.map((c) => {
      const totalCourseAssignments = c.assignments.length;
      const totalCourseSubmissions = c.assignments.reduce(
        (sum, a) => sum + a.submissions.length,
        0
      );
      const enrolledCount = c._count.enrollments;
      const totalPossible = totalCourseAssignments * Math.max(enrolledCount, 1);
      const completionRate =
        totalPossible > 0
          ? Math.round((totalCourseSubmissions / totalPossible) * 100)
          : 0;

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        enrolledCount,
        assignmentCount: totalCourseAssignments,
        submissionCount: totalCourseSubmissions,
        completionRate,
      };
    });

    // Overall completion rate
    const totalPotentialSubmissions = assignments.reduce((acc, a) => {
      const target =
        a.submissionType === 'INDIVIDUAL'
          ? totalStudents
          : a.isGlobal
          ? groups.length
          : a.assignmentGroups.length;
      return acc + target;
    }, 0);

    const overallRate = totalPotentialSubmissions > 0
      ? Math.round((totalSubmissions / totalPotentialSubmissions) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAssignments,
          totalGroups,
          totalStudents,
          totalSubmissions,
          totalCourses,
          overallRate,
        },
        groupPerformance,
        assignmentStats,
        courseStats,
        recentSubmissions,
      },
    });
  } catch (error) {
    next(error);
  }
};
