import { Router } from 'express';
import { conversations, thread, sendMessage, sendMessageRules } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);
router.get('/conversations', conversations); // must come before /:userId
router.get('/:userId', thread);
router.post('/', sendMessageRules, validate, sendMessage);

export default router;
