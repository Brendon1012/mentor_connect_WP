import { Router } from 'express';
import {
  createRequest, myRequests, transition, addReview,
  createRequestRules, respondRules, reviewRules,
} from '../controllers/requestController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate, validId } from '../middleware/validate.js';

const router = Router();

router.use(protect);
router.post('/', restrictTo('student'), createRequestRules, validate, createRequest);
router.get('/my', myRequests);
router.patch('/:id/accept', restrictTo('mentor'), validId(), respondRules, validate, transition('accept'));
router.patch('/:id/reject', restrictTo('mentor'), validId(), respondRules, validate, transition('reject'));
router.patch('/:id/complete', restrictTo('mentor'), validId(), validate, transition('complete'));
router.post('/:id/review', restrictTo('student'), validId(), reviewRules, validate, addReview);

export default router;
