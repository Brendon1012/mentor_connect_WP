import { body } from 'express-validator';
import User from '../models/User.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Session from '../models/Session.js';
import AppError from '../utils/AppError.js';
import { ok, created, asyncHandler } from '../utils/respond.js';
import { CATEGORIES, REQUEST_STATUS } from '../utils/constants.js';
import { textField } from '../validators/common.js';

/*
 * Request status state machine (enforced here, not in the UI):
 *
 *   pending --accept--> accepted --complete--> completed
 *      \--reject--> rejected
 *
 * Only the mentor the request is addressed to can move it. Any other transition -> 409.
 */
const TRANSITIONS = {
  accept: { from: 'pending', to: 'accepted' },
  reject: { from: 'pending', to: 'rejected' },
  complete: { from: 'accepted', to: 'completed' },
};

const MENTOR_PUBLIC = 'name department college avatarUrl mentorProfile.title mentorProfile.skills mentorProfile.categories isSample';
const STUDENT_PUBLIC = 'name department college avatarUrl studentProfile isSample';

export const createRequestRules = [
  body('mentorId').isMongoId().withMessage('Choose a valid mentor'),
  body('category').isIn(CATEGORIES).withMessage('Choose a valid category'),
  textField('goals', 'Goals', { min: 20, max: 1000, required: true }),
];

export const respondRules = [textField('mentorResponse', 'Response', { max: 500 })];

export const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5').toInt(),
  textField('comment', 'Comment', { max: 500 }),
];

// POST /api/requests (student only)
export const createRequest = asyncHandler(async (req, res) => {
  const { mentorId, category, goals } = req.body;
  const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
  if (!mentor) throw new AppError(404, 'Mentor not found');
  if (mentor.mentorProfile?.availability?.isAcceptingStudents === false) {
    throw new AppError(409, `${mentor.name} is not accepting new students right now`);
  }

  // Friendly application-level check. The partial unique index is the real guarantee.
  const existing = await MentorshipRequest.findOne({
    student: req.user._id,
    mentor: mentorId,
    status: { $in: ['pending', 'accepted'] },
  });
  if (existing) {
    throw new AppError(409, `You already have an ${existing.status} request with ${mentor.name}`);
  }

  try {
    const request = await MentorshipRequest.create({ student: req.user._id, mentor: mentorId, category, goals });
    await request.populate('mentor', MENTOR_PUBLIC);
    created(res, { request }, 'Mentorship request sent');
  } catch (err) {
    if (err.code === 11000) throw new AppError(409, `You already have an active request with ${mentor.name}`);
    throw err;
  }
});

// GET /api/requests/my?status=pending - students see requests they sent, mentors see requests sent to them.
export const myRequests = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'student' ? { student: req.user._id } : { mentor: req.user._id };
  if (REQUEST_STATUS.includes(req.query.status)) filter.status = req.query.status;

  const requests = await MentorshipRequest.find(filter)
    .populate('mentor', MENTOR_PUBLIC)
    .populate('student', STUDENT_PUBLIC)
    .sort({ updatedAt: -1 })
    .lean();
  ok(res, { requests });
});

// PATCH /api/requests/:id/accept | reject | complete (mentor only, own requests only)
export const transition = (action) =>
  asyncHandler(async (req, res) => {
    const { from, to } = TRANSITIONS[action];
    // Filtering by mentor: req.user._id means other users get 404 and never learn the request exists.
    const request = await MentorshipRequest.findOne({ _id: req.params.id, mentor: req.user._id });
    if (!request) throw new AppError(404, 'Request not found');
    if (request.status !== from) {
      throw new AppError(409, `Cannot ${action} a request that is ${request.status}`);
    }

    request.status = to;
    if (action === 'complete') {
      request.completedAt = new Date();
      // Future sessions of a finished mentorship would never happen, so cancel them.
      await Session.updateMany(
        { request: request._id, status: 'scheduled', scheduledAt: { $gt: new Date() } },
        { status: 'cancelled', cancelledBy: req.user._id }
      );
    } else {
      request.respondedAt = new Date();
      if (req.body.mentorResponse !== undefined) request.mentorResponse = req.body.mentorResponse;
    }
    await request.save();
    await request.populate([
      { path: 'mentor', select: MENTOR_PUBLIC },
      { path: 'student', select: STUDENT_PUBLIC },
    ]);
    const verb = { accept: 'accepted', reject: 'declined', complete: 'marked as completed' }[action];
    ok(res, { request }, `Request ${verb}`);
  });

// POST /api/requests/:id/review (student, completed requests only, once)
export const addReview = asyncHandler(async (req, res) => {
  const request = await MentorshipRequest.findOne({ _id: req.params.id, student: req.user._id });
  if (!request) throw new AppError(404, 'Request not found');
  if (request.status !== 'completed') throw new AppError(409, 'You can only review a completed mentorship');
  if (request.review?.rating) throw new AppError(409, 'You have already reviewed this mentorship');

  request.review = { rating: req.body.rating, comment: req.body.comment || '', createdAt: new Date() };
  await request.save();
  ok(res, { request }, 'Thank you for your feedback');
});
