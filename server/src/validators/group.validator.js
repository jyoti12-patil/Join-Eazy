import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, 'Group name must be at least 2 characters').max(100),
  maxMembers: z.number().int().min(2, 'Group must allow at least 2 members').max(10, 'Maximum 10 members allowed').optional().default(5),
});

export const addMemberSchema = z.object({
  identifier: z.string().trim().min(1, 'Student email or ID is required'),
});
