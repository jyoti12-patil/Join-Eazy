import { Router } from 'express';
import {
  createGroup,
  getMyGroup,
  getAllGroups,
  getGroupById,
  addMember,
  removeMember,
} from '../controllers/groups.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createGroupSchema, addMemberSchema } from '../validators/group.validator.js';

const router = Router();

// All group routes require authentication
router.use(authenticate);

router.post('/', validate(createGroupSchema), createGroup);
router.get('/my-group', getMyGroup);
router.get('/', getAllGroups);
router.get('/:id', getGroupById);
router.post('/:id/members', validate(addMemberSchema), addMember);
router.delete('/:id/members/:userId', removeMember);

export default router;
