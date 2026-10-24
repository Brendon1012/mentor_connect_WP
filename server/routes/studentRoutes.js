import { Router } from 'express';
import { getStudentProfile, updateStudentProfile } from '../controllers/studentController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { studentProfileRules } from '../validators/profileValidators.js';

const router = Router();

router.use(protect, restrictTo('student'));
router.get('/profile', getStudentProfile);
router.put('/profile', studentProfileRules, validate, updateStudentProfile);

export default router;
