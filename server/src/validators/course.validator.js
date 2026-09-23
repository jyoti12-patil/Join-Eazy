import { z } from 'zod';

export const createCourseSchema = z.object({
  name: z.string().trim().min(1, 'Course name is required').max(200),
  code: z.string().trim().min(1, 'Course code is required').max(20),
  description: z.string().trim().max(1000).optional().nullable(),
});

export const enrollStudentSchema = z.object({
  studentId: z.string().trim().min(1, 'Student name, email, or Student ID is required'),
});

export const updateCourseSchema = z.object({
  name: z.string().trim().min(1, 'Course name cannot be empty').max(200).optional(),
  code: z.string().trim().min(1, 'Course code cannot be empty').max(20).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
});
