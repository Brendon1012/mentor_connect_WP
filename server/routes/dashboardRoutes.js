import { Router } from 'express';
import { studentDashboard, mentorDashboard } from '../controllers/dashboardController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/student', restrictTo('student'), studentDashboard);
router.get('/mentor', restrictTo('mentor'), mentorDashboard);

export default router;
