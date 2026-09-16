import { z } from 'zod';

export const createAssignmentSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().trim().min(5, 'Description must be at least 5 characters'),
  dueDate: z.string().datetime({ message: 'Valid ISO date required for due date' }),
  onedriveLink: z.string().trim().url('Must be a valid URL (OneDrive link)'),
  isGlobal: z.boolean().optional().default(true),
  groupIds: z.array(z.string().uuid('Invalid group ID format')).optional().default([]),
});

export const updateAssignmentSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(5).optional(),
  dueDate: z.string().datetime().optional(),
  onedriveLink: z.string().trim().url().optional(),
  isGlobal: z.boolean().optional(),
  groupIds: z.array(z.string().uuid()).optional(),
});
