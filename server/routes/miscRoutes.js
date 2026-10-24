import { Router } from 'express';
import { publicStats, submitContact, contactRules } from '../controllers/miscController.js';
import { validate } from '../middleware/validate.js';
import { contactLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/stats/public', publicStats);
router.post('/contact', contactLimiter, contactRules, validate, submitContact);

export default router;
