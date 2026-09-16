import prisma from '../config/db.js';

export const createAssignment = async (req, res, next) => {
  try {
    const { title, description, dueDate, onedriveLink, isGlobal = true, groupIds = [] } = req.body;
    const adminId = req.user.id;

    const assignment = await prisma.$transaction(async (tx) => {
      const created = await tx.assignment.create({
        data: {
          title,
          description,
          dueDate: new Date(dueDate),
          onedriveLink,
          isGlobal: Boolean(isGlobal),
          createdById: adminId,
          ...(isGlobal === false && groupIds.length > 0 && {
            assignmentGroups: {
              create: groupIds.map((groupId) => ({
                groupId,
              })),
            },
          }),
        },
        include: {
          assignmentGroups: {
            include: {
              group: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return created;
    });

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: { assignment },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAssignments = async (req, res, next) => {
  try {
    const user = req.user;

    // If student, find student's group
    let studentGroupId = null;
    if (user.role === 'STUDENT') {
      const membership = await prisma.groupMember.findFirst({
        where: { userId: user.id },
      });
      studentGroupId = membership?.groupId || null;
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        ...(user.role === 'STUDENT'
          ? {
              OR: [
                { isGlobal: true },
                ...(studentGroupId
                  ? [
                      {
                        assignmentGroups: {
                          some: { groupId: studentGroupId },
                        },
                      },
                    ]
                  : []),
              ],
            }
          : {}),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignmentGroups: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        submissions: {
          ...(studentGroupId
            ? {
                where: { groupId: studentGroupId },
              }
            : {}),
          include: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
            submittedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
            assignmentGroups: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Add formatted submission status for student's group
    const enrichedAssignments = assignments.map((assignment) => {
      let groupSubmission = null;
      if (studentGroupId && assignment.submissions.length > 0) {
        groupSubmission = assignment.submissions[0];
      }

      const isOverdue = new Date(assignment.dueDate) < new Date();

      return {
        ...assignment,
        submissionStatus: groupSubmission
          ? groupSubmission.confirmed
            ? 'CONFIRMED'
            : 'PENDING_CONFIRMATION'
          : isOverdue
          ? 'OVERDUE'
          : 'NOT_SUBMITTED',
        groupSubmission,
      };
    });

    return res.status(200).json({
      success: true,
      data: { assignments: enrichedAssignments },
    });
  } catch (error) {
    next(error);
  }
};

export const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    let studentGroupId = null;
    if (user.role === 'STUDENT') {
      const membership = await prisma.groupMember.findFirst({
        where: { userId: user.id },
      });
      studentGroupId = membership?.groupId || null;
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignmentGroups: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        studentId: true,
                      },
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
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        studentId: true,
                      },
                    },
                  },
                },
              },
            },
            submittedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    let myGroupSubmission = null;
    if (studentGroupId) {
      myGroupSubmission = assignment.submissions.find((s) => s.groupId === studentGroupId) || null;
    }

    return res.status(200).json({
      success: true,
      data: {
        assignment,
        myGroupSubmission,
        userGroupId: studentGroupId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, onedriveLink, isGlobal, groupIds } = req.body;

    const existing = await prisma.assignment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If groupIds provided or isGlobal changed, update AssignmentGroup mapping
      if (isGlobal !== undefined || groupIds !== undefined) {
        await tx.assignmentGroup.deleteMany({
          where: { assignmentId: id },
        });

        if (isGlobal === false && Array.isArray(groupIds) && groupIds.length > 0) {
          await tx.assignmentGroup.createMany({
            data: groupIds.map((groupId) => ({
              assignmentId: id,
              groupId,
            })),
          });
        }
      }

      return tx.assignment.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(dueDate && { dueDate: new Date(dueDate) }),
          ...(onedriveLink && { onedriveLink }),
          ...(isGlobal !== undefined && { isGlobal: Boolean(isGlobal) }),
        },
        include: {
          assignmentGroups: {
            include: {
              group: {
                select: { id: true, name: true },
              },
            },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: { assignment: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.assignment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    await prisma.assignment.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
