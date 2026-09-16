import { Router } from 'express';
import {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} from '../controllers/assignments.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
} from '../validators/assignment.validator.js';

const router = Router();

// All assignment routes require authentication
router.use(authenticate);

router.get('/', getAllAssignments);
router.get('/:id', getAssignmentById);

// Admin-only routes
router.post('/', authorize('ADMIN'), validate(createAssignmentSchema), createAssignment);
router.put('/:id', authorize('ADMIN'), validate(updateAssignmentSchema), updateAssignment);
router.delete('/:id', authorize('ADMIN'), deleteAssignment);

export default router;
