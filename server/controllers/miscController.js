import { body } from 'express-validator';
import User from '../models/User.js';
import Session from '../models/Session.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import ContactMessage from '../models/ContactMessage.js';
import { ok, created, asyncHandler } from '../utils/respond.js';
import { textField } from '../validators/common.js';

// GET /api/stats/public - real counts straight from the database for the home page.
export const publicStats = asyncHandler(async (req, res) => {
  const [mentors, students, completedSessions, activeMentorships] = await Promise.all([
    User.countDocuments({ role: 'mentor' }),
    User.countDocuments({ role: 'student' }),
    Session.countDocuments({ status: 'completed' }),
    MentorshipRequest.countDocuments({ status: { $in: ['accepted', 'completed'] } }),
  ]);
  ok(res, { mentors, students, completedSessions, activeMentorships });
});

export const contactRules = [
  textField('name', 'Name', { min: 2, max: 80, required: true }),
  body('email').isString().bail().trim().isEmail().withMessage('Enter a valid email address'),
  textField('subject', 'Subject', { min: 3, max: 150, required: true }),
  textField('message', 'Message', { min: 10, max: 2000, required: true }),
];

// POST /api/contact
export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  const doc = await ContactMessage.create({ name, email, subject, message });
  created(res, { id: doc._id }, 'Thanks! Your message has been received.');
});
