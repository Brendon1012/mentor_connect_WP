import User from '../models/User.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import Session from '../models/Session.js';
import Message from '../models/Message.js';
import { ok, asyncHandler } from '../utils/respond.js';
import { PUBLIC_MENTOR_FIELDS } from '../utils/query.js';

const PEOPLE = 'name avatarUrl department college mentorProfile.title studentProfile.yearOfStudy';

// { pending: 2, accepted: 1, ... } with zeros for missing statuses.
async function countByStatus(match) {
  const rows = await MentorshipRequest.aggregate([{ $match: match }, { $group: { _id: '$status', n: { $sum: 1 } } }]);
  const counts = { pending: 0, accepted: 0, rejected: 0, completed: 0 };
  for (const r of rows) counts[r._id] = r.n;
  counts.total = Object.values(counts).reduce((a, b) => a + b, 0);
  return counts;
}

const upcomingSessions = (match) =>
  Session.find({ ...match, status: 'scheduled', scheduledAt: { $gt: new Date() } })
    .populate('student', PEOPLE)
    .populate('mentor', PEOPLE)
    .sort({ scheduledAt: 1 })
    .limit(5)
    .lean();

/*
 * Recommendation: score each accepting mentor by how many of the student's skills
 * match the mentor's skills, plus how many career interests match the mentor's
 * categories. Mentors the student already has an active request with are skipped.
 */
async function recommendMentors(student, excludeIds) {
  const lower = (arr = []) => arr.map((s) => s.toLowerCase());
  const skills = lower(student.studentProfile?.skills);
  const interests = lower(student.studentProfile?.careerInterests);

  const candidates = await User.find({
    role: 'mentor',
    _id: { $nin: excludeIds },
    'mentorProfile.availability.isAcceptingStudents': { $ne: false },
  })
    .select(PUBLIC_MENTOR_FIELDS)
    .limit(200)
    .lean();

  const scored = candidates.map((m) => {
    const matchedSkills = (m.mentorProfile?.skills || []).filter((s) => skills.includes(s.toLowerCase()));
    const matchedCats = (m.mentorProfile?.categories || []).filter((c) => interests.includes(c.toLowerCase()));
    return { mentor: m, score: matchedSkills.length + matchedCats.length, matches: [...matchedSkills, ...matchedCats] };
  });

  const hasProfileData = skills.length > 0 || interests.length > 0;
  const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  if (matched.length) return { basedOnProfile: true, items: matched.slice(0, 4) };

  // No overlap (or empty profile): fall back to most experienced mentors and say so.
  const fallback = scored
    .sort((a, b) => (b.mentor.mentorProfile?.yearsOfExperience || 0) - (a.mentor.mentorProfile?.yearsOfExperience || 0))
    .slice(0, 4);
  return { basedOnProfile: false, hasProfileData, items: fallback };
}

// GET /api/dashboard/student
export const studentDashboard = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const [counts, requests, sessions, unreadMessages, completedSessions] = await Promise.all([
    countByStatus({ student: me }),
    MentorshipRequest.find({ student: me, status: { $in: ['pending', 'accepted'] } })
      .populate('mentor', PEOPLE)
      .sort({ updatedAt: -1 })
      .lean(),
    upcomingSessions({ student: me }),
    Message.countDocuments({ receiver: me, read: false }),
    Session.countDocuments({ student: me, status: 'completed' }),
  ]);

  const activeMentorIds = requests.map((r) => r.mentor?._id).filter(Boolean);
  const [recommended, recentlyViewed] = await Promise.all([
    recommendMentors(req.user, activeMentorIds),
    User.find({ _id: { $in: req.user.recentlyViewedMentors }, role: 'mentor' }).select(PUBLIC_MENTOR_FIELDS).lean(),
  ]);
  // Keep the "newest first" order stored on the user.
  const order = req.user.recentlyViewedMentors.map(String);
  recentlyViewed.sort((a, b) => order.indexOf(String(a._id)) - order.indexOf(String(b._id)));

  ok(res, {
    profileCompletion: req.user.profileCompletion(),
    counts: { ...counts, upcomingSessions: sessions.length, completedSessions, unreadMessages },
    pendingRequests: requests.filter((r) => r.status === 'pending'),
    acceptedRequests: requests.filter((r) => r.status === 'accepted'),
    upcomingSessions: sessions,
    recommended,
    recentlyViewed: recentlyViewed.slice(0, 5),
  });
});

// GET /api/dashboard/mentor
export const mentorDashboard = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const [counts, requests, sessions, unreadMessages, completedSessions, reviewStats, recentRequests, recentSessions] =
    await Promise.all([
      countByStatus({ mentor: me }),
      MentorshipRequest.find({ mentor: me, status: { $in: ['pending', 'accepted'] } })
        .populate('student', PEOPLE)
        .sort({ updatedAt: -1 })
        .lean(),
      upcomingSessions({ mentor: me }),
      Message.countDocuments({ receiver: me, read: false }),
      Session.countDocuments({ mentor: me, status: 'completed' }),
      MentorshipRequest.aggregate([
        { $match: { mentor: me, 'review.rating': { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$review.rating' }, n: { $sum: 1 } } },
      ]),
      MentorshipRequest.find({ mentor: me }).populate('student', 'name').sort({ updatedAt: -1 }).limit(6).lean(),
      Session.find({ mentor: me }).populate('student', 'name').sort({ updatedAt: -1 }).limit(6).lean(),
    ]);

  // Recent activity is derived from real records, newest first.
  const activity = [
    ...recentRequests.map((r) => ({
      type: 'request',
      id: r._id,
      at: r.updatedAt,
      text:
        r.status === 'pending'
          ? `${r.student?.name || 'A student'} requested mentorship in ${r.category}`
          : `Mentorship with ${r.student?.name || 'a student'} is ${r.status}`,
    })),
    ...recentSessions.map((s) => ({
      type: 'session',
      id: s._id,
      at: s.updatedAt,
      text: `Session "${s.title}" with ${s.student?.name || 'a student'} is ${s.status}`,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8);

  ok(res, {
    profileCompletion: req.user.profileCompletion(),
    counts: {
      ...counts,
      studentsMentored: counts.accepted + counts.completed,
      upcomingSessions: sessions.length,
      completedSessions,
      unreadMessages,
    },
    rating: reviewStats[0] ? { average: Math.round(reviewStats[0].avg * 10) / 10, count: reviewStats[0].n } : null,
    pendingRequests: requests.filter((r) => r.status === 'pending'),
    acceptedRequests: requests.filter((r) => r.status === 'accepted'),
    upcomingSessions: sessions,
    recentActivity: activity,
  });
});
