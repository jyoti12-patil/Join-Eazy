import { Router } from 'express';
import {
  confirmSubmission,
  getSubmissionsByAssignment,
  getMyGroupSubmissions,
} from '../controllers/submissions.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { confirmSubmissionSchema } from '../validators/submission.validator.js';

const router = Router();

router.use(authenticate);

// Student confirms submission via two-step verification
router.post('/confirm', validate(confirmSubmissionSchema), confirmSubmission);

// Student gets their group's submissions & progress
router.get('/my-group', getMyGroupSubmissions);

// Professor tracks submissions by assignment
router.get('/assignment/:assignmentId', authorize('ADMIN'), getSubmissionsByAssignment);

export default router;
