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
  submissionNote: z.string().trim().max(500).optional().nullable(),
});
