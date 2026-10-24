import { body } from 'express-validator';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Message from '../models/Message.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import AppError from '../utils/AppError.js';
import { ok, created, asyncHandler } from '../utils/respond.js';
import { textField } from '../validators/common.js';

export const sendMessageRules = [
  body('receiverId').isMongoId().withMessage('Choose who to message'),
  textField('text', 'Message', { min: 1, max: 1000, required: true }),
];

// Two users may message only if they share an accepted or completed mentorship.
async function canMessage(userA, userB) {
  return MentorshipRequest.exists({
    status: { $in: ['accepted', 'completed'] },
    $or: [
      { student: userA, mentor: userB },
      { student: userB, mentor: userA },
    ],
  });
}

// GET /api/messages/conversations - everyone I am connected to, with last message and unread count.
export const conversations = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const requests = await MentorshipRequest.find({
    status: { $in: ['accepted', 'completed'] },
    $or: [{ student: me }, { mentor: me }],
  })
    .select('student mentor status')
    .lean();

  // One entry per person, even if there were several mentorships with them.
  const contactIds = [...new Set(requests.map((r) => String(r.student.equals(me) ? r.mentor : r.student)))];
  const contacts = await User.find({ _id: { $in: contactIds } })
    .select('name role avatarUrl department mentorProfile.title')
    .lean();

  const result = await Promise.all(
    contacts.map(async (c) => {
      const [lastMessage, unread] = await Promise.all([
        Message.findOne({ $or: [{ sender: me, receiver: c._id }, { sender: c._id, receiver: me }] })
          .sort({ createdAt: -1 })
          .lean(),
        Message.countDocuments({ sender: c._id, receiver: me, read: false }),
      ]);
      return { user: c, lastMessage, unread };
    })
  );

  // Most recent conversation first; contacts without messages go last.
  result.sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0));
  ok(res, { conversations: result, totalUnread: result.reduce((s, c) => s + c.unread, 0) });
});

// GET /api/messages/:userId - the thread with one person. Marks their messages to me as read.
export const thread = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const otherId = req.params.userId;
  if (!mongoose.isValidObjectId(otherId)) throw new AppError(400, 'Invalid id');
  if (!(await canMessage(me, otherId))) {
    throw new AppError(403, 'You can only message people you have an active or completed mentorship with');
  }

  const other = await User.findById(otherId).select('name role avatarUrl department mentorProfile.title').lean();
  await Message.updateMany({ sender: otherId, receiver: me, read: false }, { read: true });

  // Latest 200 messages, returned oldest-first for display.
  const messages = (
    await Message.find({ $or: [{ sender: me, receiver: otherId }, { sender: otherId, receiver: me }] })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
  ).reverse();

  ok(res, { user: other, messages });
});

// POST /api/messages
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, text } = req.body;
  if (receiverId === String(req.user._id)) throw new AppError(400, 'You cannot message yourself');
  if (!(await canMessage(req.user._id, receiverId))) {
    throw new AppError(403, 'You can only message people you have an active or completed mentorship with');
  }
  const message = await Message.create({ sender: req.user._id, receiver: receiverId, text });
  created(res, { message }, 'Message sent');
});
