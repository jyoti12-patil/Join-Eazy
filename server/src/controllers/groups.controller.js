import prisma from '../config/db.js';

export const createGroup = async (req, res, next) => {
  try {
    const { name, maxMembers = 5 } = req.body;
    const userId = req.user.id;

    // Check if user is already in a group
    const existingMembership = await prisma.groupMember.findFirst({
      where: { userId },
      include: { group: true },
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: `You are already a member of group "${existingMembership.group.name}". Students may only belong to one active group.`,
      });
    }

    // Create group and add creator as LEADER in a transaction
    const newGroup = await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name,
          maxMembers: maxMembers || 5,
          createdById: userId,
        },
      });

      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId,
          role: 'LEADER',
        },
      });

      return tx.group.findUnique({
        where: { id: group.id },
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
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: { group: newGroup },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const membership = await prisma.groupMember.findFirst({
      where: { userId },
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
      },
    });

    return res.status(200).json({
      success: true,
      data: { group: membership ? membership.group : null, role: membership ? membership.role : null },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllGroups = async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: { groups },
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const group = await prisma.group.findUnique({
      where: { id },
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
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: { group },
    });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const { identifier } = req.body; // Can be email or studentId
    const currentUserId = req.user.id;

    // Verify group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Verify current user is a member of this group (or Admin)
    const isMember = group.members.some((m) => m.userId === currentUserId);
    if (!isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only group members can add new students to this group.',
      });
    }

    // Check capacity
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: `Group is full. Maximum limit is ${group.maxMembers} members.`,
      });
    }

    // Find student by email or studentId
    const targetStudent = await prisma.user.findFirst({
      where: {
        role: 'STUDENT',
        OR: [
          { email: identifier.trim().toLowerCase() },
          { studentId: identifier.trim() },
        ],
      },
    });

    if (!targetStudent) {
      return res.status(404).json({
        success: false,
        message: `No student found matching "${identifier}". Please check the student email or student ID.`,
      });
    }

    // Check if target student is already in ANY group
    const existingMembership = await prisma.groupMember.findFirst({
      where: { userId: targetStudent.id },
      include: { group: true },
    });

    if (existingMembership) {
      if (existingMembership.groupId === groupId) {
        return res.status(400).json({
          success: false,
          message: `${targetStudent.name} is already a member of this group.`,
        });
      }
      return res.status(400).json({
        success: false,
        message: `${targetStudent.name} is already in another group ("${existingMembership.group.name}").`,
      });
    }

    // Add member
    const newMember = await prisma.groupMember.create({
      data: {
        groupId,
        userId: targetStudent.id,
        role: 'MEMBER',
      },
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
    });

    return res.status(201).json({
      success: true,
      message: `${targetStudent.name} has been added to the group!`,
      data: { member: newMember },
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { id: groupId, userId: targetUserId } = req.params;
    const currentUserId = req.user.id;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    const currentMemberRecord = group.members.find((m) => m.userId === currentUserId);
    const isLeader = currentMemberRecord?.role === 'LEADER';
    const isSelf = currentUserId === targetUserId;

    if (!isLeader && !isSelf && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only group leaders or admins can remove other members.',
      });
    }

    // Check if target is in group
    const targetMember = group.members.find((m) => m.userId === targetUserId);
    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: 'Student is not a member of this group',
      });
    }

    // If the leader is leaving and others remain, designate next leader
    await prisma.$transaction(async (tx) => {
      await tx.groupMember.delete({
        where: {
          groupId_userId: {
            groupId,
            userId: targetUserId,
          },
        },
      });

      if (targetMember.role === 'LEADER') {
        const remaining = await tx.groupMember.findFirst({
          where: { groupId },
          orderBy: { joinedAt: 'asc' },
        });
        if (remaining) {
          await tx.groupMember.update({
            where: { id: remaining.id },
            data: { role: 'LEADER' },
          });
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
