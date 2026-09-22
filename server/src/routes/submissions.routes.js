import { Router } from 'express';
import {
  confirmSubmission,
  getSubmissionsByAssignment,
  getMyGroupSubmissions,
  gradeSubmission,
  gradeSubmissionDirect,
} from '../controllers/submissions.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  confirmSubmissionSchema,
  gradeSubmissionSchema,
  gradeSubmissionDirectSchema,
} from '../validators/submission.validator.js';

const router = Router();

router.use(authenticate);

// Student confirms submission via two-step verification
router.post('/confirm', validate(confirmSubmissionSchema), confirmSubmission);

// Student gets their group's submissions & progress
router.get('/my-group', getMyGroupSubmissions);

// Professor tracks submissions by assignment
router.get('/assignment/:assignmentId', authorize('ADMIN'), getSubmissionsByAssignment);

// Professor grades a submission by submissionId
router.put('/:id/grade', authorize('ADMIN'), validate(gradeSubmissionSchema), gradeSubmission);

// Professor direct-grades an assignment for group or student
router.post('/grade', authorize('ADMIN'), validate(gradeSubmissionDirectSchema), gradeSubmissionDirect);

export default router;
