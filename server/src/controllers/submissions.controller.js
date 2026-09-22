import prisma from '../config/db.js';

/**
 * Confirm Submission — Leader-only for GROUP assignments, any student for INDIVIDUAL
 */
export const confirmSubmission = async (req, res, next) => {
  try {
    const { assignmentId, confirmed, submissionNote } = req.body;
    const userId = req.user.id;

    if (!confirmed) {
      return res.status(400).json({
        success: false,
        message: 'Submission confirmation flag must be true.',
      });
    }

    // 1. Check assignment exists and get its type
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        assignmentGroups: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found.',
      });
    }

    // 2. Handle INDIVIDUAL submissions
    if (assignment.submissionType === 'INDIVIDUAL') {
      const existing = await prisma.submission.findFirst({
        where: {
          assignmentId,
          submittedById: userId,
          groupId: null,
        },
      });

      let submission;
      if (existing) {
        submission = await prisma.submission.update({
          where: { id: existing.id },
          data: {
            confirmed: true,
            confirmedAt: new Date(),
            ...(submissionNote !== undefined && { submissionNote }),
          },
          include: {
            assignment: {
              select: { id: true, title: true, dueDate: true, onedriveLink: true },
            },
            submittedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        });
      } else {
        submission = await prisma.submission.create({
          data: {
            assignmentId,
            groupId: null,
            submittedById: userId,
            confirmed: true,
            confirmedAt: new Date(),
            submissionNote: submissionNote || null,
          },
          include: {
            assignment: {
              select: { id: true, title: true, dueDate: true, onedriveLink: true },
            },
            submittedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: `Individual submission for "${assignment.title}" confirmed.`,
        data: { submission },
      });
    }

    // 3. Handle GROUP submissions — check student has a group
    const membership = await prisma.groupMember.findFirst({
      where: { userId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, studentId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return res.status(400).json({
        success: false,
        message: 'You must belong to a group to confirm a group assignment submission. Please create or join a group first.',
      });
    }

    // 4. LEADER-ONLY enforcement for GROUP assignments
    if (membership.role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        message: 'Only the group leader can submit and acknowledge group assignments. Please ask your group leader to confirm the submission.',
      });
    }

    const groupId = membership.groupId;

    // 5. Verify assignment is available to this group
    if (!assignment.isGlobal) {
      const isAssigned = assignment.assignmentGroups.some((ag) => ag.groupId === groupId);
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'This assignment was not assigned to your group.',
        });
      }
    }

    // 6. Create or update submission with leader acknowledgment
    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_groupId: {
          assignmentId,
          groupId,
        },
      },
      update: {
        confirmed: true,
        confirmedAt: new Date(),
        submittedById: userId,
        acknowledgedByLeader: true,
        leaderAcknowledgedAt: new Date(),
        ...(submissionNote !== undefined && { submissionNote }),
      },
      create: {
        assignmentId,
        groupId,
        submittedById: userId,
        confirmed: true,
        confirmedAt: new Date(),
        acknowledgedByLeader: true,
        leaderAcknowledgedAt: new Date(),
        submissionNote: submissionNote || null,
      },
      include: {
        assignment: {
          select: { id: true, title: true, dueDate: true, onedriveLink: true },
        },
        group: {
          select: { id: true, name: true },
        },
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Assignment "${assignment.title}" submission confirmed by group leader for group "${membership.group.name}". All group members will see this as acknowledged.`,
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Submissions for a specific assignment (Admin view)
 */
export const getSubmissionsByAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        assignmentGroups: {
          include: {
            group: {
              include: {
                members: {
                  include: {
                    user: {
                      select: { id: true, name: true, email: true, studentId: true },
                    },
                  },
                },
              },
            },
          },
        },
        submissions: {
          include: {
            group: {
              include: {
                members: {
                  include: {
                    user: {
                      select: { id: true, name: true, email: true, studentId: true },
                    },
                  },
                },
              },
            },
            submittedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found.',
      });
    }

    // Handle GROUP assignment view
    if (assignment.submissionType === 'GROUP') {
      let targetGroups = [];
      if (assignment.isGlobal) {
        targetGroups = await prisma.group.findMany({
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, studentId: true },
                },
              },
            },
          },
        });
      } else {
        targetGroups = assignment.assignmentGroups.map((ag) => ag.group);
      }

      const groupStatus = targetGroups.map((group) => {
        const submission = assignment.submissions.find((s) => s.groupId === group.id);
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
          hasSubmitted: Boolean(submission && submission.confirmed),
          acknowledgedByLeader: Boolean(submission && submission.acknowledgedByLeader),
          submittedAt: submission?.submittedAt || null,
          confirmedAt: submission?.confirmedAt || null,
          leaderAcknowledgedAt: submission?.leaderAcknowledgedAt || null,
          submittedBy: submission?.submittedBy || null,
          submissionNote: submission?.submissionNote || null,
        };
      });

      const totalTargetGroups = groupStatus.length;
      const submittedCount = groupStatus.filter((g) => g.hasSubmitted).length;
      const pendingCount = totalTargetGroups - submittedCount;
      const completionRate = totalTargetGroups > 0 ? Math.round((submittedCount / totalTargetGroups) * 100) : 0;

      return res.status(200).json({
        success: true,
        data: {
          assignment: {
            id: assignment.id,
            title: assignment.title,
            dueDate: assignment.dueDate,
            onedriveLink: assignment.onedriveLink,
            submissionType: assignment.submissionType,
          },
          stats: {
            totalTargetGroups,
            submittedCount,
            pendingCount,
            completionRate,
          },
          groupStatus,
        },
      });
    }

    // Handle INDIVIDUAL assignment view
    let targetStudents = [];
    if (assignment.courseId) {
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { courseId: assignment.courseId },
        include: {
          student: {
            select: { id: true, name: true, email: true, studentId: true },
          },
        },
      });
      targetStudents = enrollments.map((e) => e.student).filter(Boolean);
    } else {
      targetStudents = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, name: true, email: true, studentId: true },
      });
    }

    const studentStatus = targetStudents.map((student) => {
      const submission = assignment.submissions.find(
        (s) => s.submittedById === student.id && !s.groupId
      );
      return {
        student,
        hasSubmitted: Boolean(submission && submission.confirmed),
        submittedAt: submission?.submittedAt || null,
        confirmedAt: submission?.confirmedAt || null,
        submissionNote: submission?.submissionNote || null,
      };
    });

    const totalTarget = studentStatus.length;
    const submittedCount = studentStatus.filter((s) => s.hasSubmitted).length;
    const pendingCount = Math.max(0, totalTarget - submittedCount);
    const completionRate = totalTarget > 0 ? Math.round((submittedCount / totalTarget) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        assignment: {
          id: assignment.id,
          title: assignment.title,
          dueDate: assignment.dueDate,
          onedriveLink: assignment.onedriveLink,
          submissionType: assignment.submissionType,
        },
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
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Submissions for current student's group
 */
export const getMyGroupSubmissions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const membership = await prisma.groupMember.findFirst({
      where: { userId },
    });

    // Fetch all assignments applicable to this student
    const assignments = await prisma.assignment.findMany({
      where: {
        OR: [
          { isGlobal: true },
          ...(membership ? [{ assignmentGroups: { some: { groupId: membership.groupId } } }] : []),
        ],
      },
      include: {
        course: {
          select: { id: true, name: true, code: true },
        },
        submissions: {
          where: membership
            ? {
                OR: [
                  { groupId: membership.groupId },
                  { submittedById: userId, groupId: null },
                ],
              }
            : { submittedById: userId },
          include: {
            submittedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const submissions = assignments.map((assignment) => {
      let submission = null;
      if (assignment.submissionType === 'GROUP' && membership) {
        submission = assignment.submissions.find((s) => s.groupId === membership.groupId) || null;
      } else if (assignment.submissionType === 'INDIVIDUAL') {
        submission = assignment.submissions.find((s) => s.submittedById === userId && !s.groupId) || null;
      }
      const isOverdue = new Date(assignment.dueDate) < new Date();

      return {
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        dueDate: assignment.dueDate,
        onedriveLink: assignment.onedriveLink,
        submissionType: assignment.submissionType,
        course: assignment.course,
        hasSubmitted: Boolean(submission && submission.confirmed),
        acknowledgedByLeader: Boolean(submission && submission.acknowledgedByLeader),
        submittedAt: submission?.submittedAt || null,
        confirmedAt: submission?.confirmedAt || null,
        submittedBy: submission?.submittedBy || null,
        submissionNote: submission?.submissionNote || null,
        status: submission?.confirmed ? 'CONFIRMED' : isOverdue ? 'OVERDUE' : 'PENDING',
      };
    });

    const total = submissions.length;
    const completed = submissions.filter((s) => s.hasSubmitted).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        submissions,
        stats: {
          total,
          completed,
          percentage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
