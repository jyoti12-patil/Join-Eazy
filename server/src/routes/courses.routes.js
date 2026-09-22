import { Router } from 'express';
import {
  createCourse,
  getCourses,
  getCourseById,
  enrollStudent,
  unenrollStudent,
  updateCourse,
  deleteCourse,
} from '../controllers/courses.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createCourseSchema,
  enrollStudentSchema,
  updateCourseSchema,
} from '../validators/course.validator.js';

const router = Router();

router.use(authenticate);

// Both roles can list courses (filtered by role)
router.get('/', getCourses);
router.get('/:id', getCourseById);

// Admin-only routes
router.post('/', authorize('ADMIN'), validate(createCourseSchema), createCourse);
router.put('/:id', authorize('ADMIN'), validate(updateCourseSchema), updateCourse);
router.delete('/:id', authorize('ADMIN'), deleteCourse);
router.post('/:id/enroll', authorize('ADMIN'), validate(enrollStudentSchema), enrollStudent);
router.delete('/:id/enroll/:studentId', authorize('ADMIN'), unenrollStudent);

export default router;
