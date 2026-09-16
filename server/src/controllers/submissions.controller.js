import prisma from '../config/db.js';

/**
 * Two-Step Submission Confirmation
 * Step 1: User verifies they uploaded to OneDrive and clicks "Yes, I have submitted"
 * Step 2: Confirmation request sent with confirmed: true
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

    // 1. Check student has a group
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
        message: 'You must belong to a group to confirm an assignment submission. Please create or join a group first.',
      });
    }

    const groupId = membership.groupId;

    // 2. Check assignment exists
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

    // 3. Verify assignment is available to this group
    if (!assignment.isGlobal) {
      const isAssigned = assignment.assignmentGroups.some((ag) => ag.groupId === groupId);
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'This assignment was not assigned to your group.',
        });
      }
    }

    // 4. Create or update submission
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
        ...(submissionNote !== undefined && { submissionNote }),
      },
      create: {
        assignmentId,
        groupId,
        submittedById: userId,
        confirmed: true,
        confirmedAt: new Date(),
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
      message: `Assignment "${assignment.title}" submission confirmed for group "${membership.group.name}".`,
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

    // Get all relevant groups
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

    // Map each group with its submission status
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
        submittedAt: submission?.submittedAt || null,
        confirmedAt: submission?.confirmedAt || null,
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

    if (!membership) {
      return res.status(200).json({
        success: true,
        data: { submissions: [], stats: { total: 0, completed: 0, percentage: 0 } },
      });
    }

    const groupId = membership.groupId;

    // Fetch all assignments applicable to this group
    const assignments = await prisma.assignment.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { assignmentGroups: { some: { groupId } } },
        ],
      },
      include: {
        submissions: {
          where: { groupId },
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
      const submission = assignment.submissions[0] || null;
      const isOverdue = new Date(assignment.dueDate) < new Date();

      return {
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        dueDate: assignment.dueDate,
        onedriveLink: assignment.onedriveLink,
        hasSubmitted: Boolean(submission && submission.confirmed),
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
