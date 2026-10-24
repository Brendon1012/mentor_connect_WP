import { Router } from 'express';
import { register, login, logout, me, changePassword } from '../controllers/authController.js';
import { registerRules, loginRules, changePasswordRules } from '../validators/authValidators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.post('/logout', logout);
router.get('/me', protect, me);
router.put('/password', authLimiter, protect, changePasswordRules, validate, changePassword);

export default router;
