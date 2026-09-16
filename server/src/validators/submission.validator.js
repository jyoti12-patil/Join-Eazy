import { z } from 'zod';

export const initiateSubmissionSchema = z.object({
  assignmentId: z.string().uuid('Invalid assignment ID'),
  submissionNote: z.string().trim().max(500).optional(),
});

export const confirmSubmissionSchema = z.object({
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm that you have submitted your work to OneDrive.' }),
  }),
});
