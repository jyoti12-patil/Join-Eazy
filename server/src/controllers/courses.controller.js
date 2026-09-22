import prisma from '../config/db.js';

export const createCourse = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    const professorId = req.user.id;

    const existing = await prisma.course.findUnique({ where: { code } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A course with code "${code}" already exists.`,
      });
    }

    const course = await prisma.course.create({
      data: {
        name,
        code: code.toUpperCase(),
        description: description || null,
        professorId,
      },
      include: {
        professor: {
          select: { id: true, name: true, email: true },
        },
        _count: { select: { enrollments: true, assignments: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

export const getCourses = async (req, res, next) => {
  try {
    const user = req.user;

    let whereClause = {};
    if (user.role === 'ADMIN') {
      whereClause = { professorId: user.id };
    } else {
      whereClause = {
        enrollments: { some: { studentId: user.id } },
      };
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        professor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { enrollments: true, assignments: true },
        },
        assignments: {
          select: {
            id: true,
            submissions: {
              where: { confirmed: true },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute completion rates per course
    const enriched = courses.map((course) => {
      const totalAssignments = course.assignments.length;
      const totalSubmissions = course.assignments.reduce(
        (sum, a) => sum + a.submissions.length,
        0
      );
      const enrolledCount = course._count.enrollments;
      const totalPossible = totalAssignments * Math.max(enrolledCount, 1);
      const completionRate =
        totalPossible > 0
          ? Math.round((totalSubmissions / totalPossible) * 100)
          : 0;

      const { assignments, ...rest } = course;
      return {
        ...rest,
        completionRate,
      };
    });

    return res.status(200).json({
      success: true,
      data: { courses: enriched },
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        professor: {
          select: { id: true, name: true, email: true },
        },
        enrollments: {
          include: {
            student: {
              select: { id: true, name: true, email: true, studentId: true },
            },
          },
        },
        assignments: {
          include: {
            submissions: {
              where: { confirmed: true },
              select: { id: true, groupId: true, submittedById: true },
            },
            _count: { select: { submissions: true } },
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentCandidates = async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, email: true, studentId: true },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({
      success: true,
      data: { students },
    });
  } catch (error) {
    next(error);
  }
};

export const enrollStudent = async (req, res, next) => {
  try {
    const { id: courseId } = req.params;
    const { studentId } = req.body;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const query = (studentId || '').trim();
    const student = await prisma.user.findFirst({
      where: {
        role: 'STUDENT',
        OR: [
          { id: query },
          { email: { equals: query, mode: 'insensitive' } },
          { studentId: { equals: query, mode: 'insensitive' } },
        ],
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student not found matching "${query}". Please check the email or Student ID.`,
      });
    }

    const existing = await prisma.courseEnrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId: student.id } },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `${student.name} is already enrolled in this course.`,
      });
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: { courseId, studentId: student.id },
      include: {
        student: {
          select: { id: true, name: true, email: true, studentId: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: `${student.name} enrolled successfully`,
      data: { enrollment },
    });
  } catch (error) {
    next(error);
  }
};

export const unenrollStudent = async (req, res, next) => {
  try {
    const { id: courseId, studentId } = req.params;

    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        courseId,
        OR: [
          { studentId },
          { student: { email: { equals: studentId, mode: 'insensitive' } } },
          { student: { studentId: { equals: studentId, mode: 'insensitive' } } },
        ],
      },
      include: {
        student: { select: { id: true, name: true } },
      },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment record not found',
      });
    }

    await prisma.courseEnrollment.delete({
      where: { id: enrollment.id },
    });

    return res.status(200).json({
      success: true,
      message: `${enrollment.student?.name || 'Student'} unenrolled successfully`,
      data: { studentId: enrollment.studentId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (code && code.toUpperCase() !== existing.code) {
      const codeTaken = await prisma.course.findFirst({
        where: {
          code: code.toUpperCase(),
          NOT: { id },
        },
      });
      if (codeTaken) {
        return res.status(409).json({
          success: false,
          message: `A course with code "${code}" already exists.`,
        });
      }
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(code && { code: code.trim().toUpperCase() }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
      },
      include: {
        professor: {
          select: { id: true, name: true, email: true },
        },
        _count: { select: { enrollments: true, assignments: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: { course: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    await prisma.course.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
