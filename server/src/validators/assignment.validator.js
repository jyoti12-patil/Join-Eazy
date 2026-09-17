import { z } from 'zod';

const isValidUrl = (val) => {
  try {
    const url = new URL(val);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const normalizeUrl = (val) => {
  if (!val) return val;
  const trimmed = val.trim();
  return !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
};

export const createAssignmentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().min(1, 'Description is required'),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid date required for due date',
    }),
  onedriveLink: z
    .string()
    .trim()
    .min(1, 'OneDrive link is required')
    .transform(normalizeUrl)
    .refine(isValidUrl, { message: 'Must be a valid URL (OneDrive link)' }),
  isGlobal: z.boolean().optional().default(true),
  groupIds: z.array(z.string()).optional().default([]),
});

export const updateAssignmentSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(200).optional(),
  description: z.string().trim().min(1, 'Description cannot be empty').optional(),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid date required for due date',
    })
    .optional(),
  onedriveLink: z
    .string()
    .trim()
    .transform(normalizeUrl)
    .refine((val) => !val || isValidUrl(val), { message: 'Must be a valid URL (OneDrive link)' })
    .optional(),
  isGlobal: z.boolean().optional(),
  groupIds: z.array(z.string()).optional(),
});

