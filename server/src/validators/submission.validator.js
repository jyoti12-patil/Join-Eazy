import { z } from 'zod';

export const initiateSubmissionSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  submissionNote: z.string().trim().max(500).optional().nullable(),
});

export const confirmSubmissionSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm that you have submitted your work to OneDrive.' }),
  }),
  submissionNote: z
    .string()
    .trim()
    .max(500, 'Submission note cannot exceed 500 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export const gradeSubmissionSchema = z.object({
  grade: z.coerce.number().min(1, 'Rating must be between 1 and 10').max(10, 'Rating cannot exceed 10').nullable().optional(),
  feedback: z.string().trim().max(2000, 'Feedback cannot exceed 2000 characters').nullable().optional(),
});

export const gradeSubmissionDirectSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  groupId: z.string().optional().nullable(),
  studentId: z.string().optional().nullable(),
  grade: z.coerce.number().min(1, 'Rating must be between 1 and 10').max(10, 'Rating cannot exceed 10').nullable().optional(),
  feedback: z.string().trim().max(2000, 'Feedback cannot exceed 2000 characters').nullable().optional(),
});
