import { Router } from 'express';
import { listMentors, mentorFilterOptions, getMentor, updateMentorProfile } from '../controllers/mentorController.js';
import { protect, optionalAuth, restrictTo } from '../middleware/auth.js';
import { validate, validId } from '../middleware/validate.js';
import { mentorProfileRules } from '../validators/profileValidators.js';

const router = Router();

router.get('/', listMentors);
router.get('/filters', mentorFilterOptions);
router.put('/profile', protect, restrictTo('mentor'), mentorProfileRules, validate, updateMentorProfile);
router.get('/:id', validId(), validate, optionalAuth, getMentor);

export default router;
