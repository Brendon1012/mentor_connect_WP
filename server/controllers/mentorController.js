import { matchedData } from 'express-validator';
import User from '../models/User.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import AppError from '../utils/AppError.js';
import { ok, asyncHandler } from '../utils/respond.js';
import { escapeRegex, pageParams, PUBLIC_MENTOR_FIELDS } from '../utils/query.js';

// GET /api/mentors?search=&skill=&department=&category=&sort=name|experience&order=asc|desc&page=&limit=
export const listMentors = asyncHandler(async (req, res) => {
  const { search, skill, department, category, sort = 'name', order } = req.query;
  const filter = { role: 'mentor' };

  if (typeof search === 'string' && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: rx }, { 'mentorProfile.title': rx }, { 'mentorProfile.skills': rx }];
  }
  if (typeof skill === 'string' && skill.trim()) {
    filter['mentorProfile.skills'] = new RegExp(`^${escapeRegex(skill.trim())}$`, 'i');
  }
  if (typeof department === 'string' && department.trim()) {
    filter.department = new RegExp(`^${escapeRegex(department.trim())}$`, 'i');
  }
  if (typeof category === 'string' && category.trim()) {
    filter['mentorProfile.categories'] = category.trim();
  }

  const dir = order === 'desc' ? -1 : order === 'asc' ? 1 : sort === 'experience' ? -1 : 1;
  const sortSpec =
    sort === 'experience' ? { 'mentorProfile.yearsOfExperience': dir, name: 1 } : { name: dir };

  const { page, limit, skip } = pageParams(req.query);
  const [mentors, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_MENTOR_FIELDS)
      .sort(sortSpec)
      .collation({ locale: 'en', strength: 2 }) // case-insensitive name sort
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  ok(res, { mentors, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

// GET /api/mentors/filters - option lists for the filter dropdowns, built from real data.
export const mentorFilterOptions = asyncHandler(async (req, res) => {
  const [skills, departments] = await Promise.all([
    User.distinct('mentorProfile.skills', { role: 'mentor' }),
    User.distinct('department', { role: 'mentor' }),
  ]);
  const sortCI = (a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' });
  ok(res, { skills: skills.filter(Boolean).sort(sortCI), departments: departments.filter(Boolean).sort(sortCI) });
});

// GET /api/mentors/:id - public profile, real reviews, and (for a logged-in student) their request status.
export const getMentor = asyncHandler(async (req, res) => {
  const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' }).select(PUBLIC_MENTOR_FIELDS).lean();
  if (!mentor) throw new AppError(404, 'Mentor not found');

  const [reviewDocs, studentsMentored] = await Promise.all([
    MentorshipRequest.find({ mentor: mentor._id, status: 'completed', 'review.rating': { $exists: true } })
      .select('review category student')
      .populate('student', 'name avatarUrl')
      .sort({ 'review.createdAt': -1 })
      .limit(20)
      .lean(),
    MentorshipRequest.countDocuments({ mentor: mentor._id, status: { $in: ['accepted', 'completed'] } }),
  ]);

  const reviews = reviewDocs.map((r) => ({
    _id: r._id,
    rating: r.review.rating,
    comment: r.review.comment,
    createdAt: r.review.createdAt,
    category: r.category,
    studentName: r.student?.name || 'Former student',
  }));
  const averageRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  let viewer = null;
  if (req.user?.role === 'student') {
    // Remember this mentor in the student's "recently viewed" list (newest first, max 10).
    await User.updateOne({ _id: req.user._id }, { $pull: { recentlyViewedMentors: mentor._id } });
    await User.updateOne(
      { _id: req.user._id },
      { $push: { recentlyViewedMentors: { $each: [mentor._id], $position: 0, $slice: 10 } } }
    );
    const active = await MentorshipRequest.findOne({
      student: req.user._id,
      mentor: mentor._id,
      status: { $in: ['pending', 'accepted'] },
    })
      .select('status')
      .lean();
    viewer = { activeRequest: active ? { _id: active._id, status: active.status } : null };
  }

  ok(res, { mentor, reviews, averageRating, stats: { studentsMentored }, viewer });
});

// Copies validated fields onto the user document. Shared by mentor and student profile updates.
// matchedData() returns ONLY fields that passed a validation rule, which acts as our whitelist.
export function applyProfileUpdate(user, data, profileKey, profileFields) {
  for (const key of ['name', 'college', 'department', 'avatarUrl']) {
    if (data[key] !== undefined) user[key] = data[key];
  }
  if (!user[profileKey]) user[profileKey] = {};
  for (const key of profileFields) {
    if (data[key] === undefined) continue;
    if (key === 'availability') {
      const current = user[profileKey].availability || {};
      user[profileKey].availability = {
        days: data.availability.days ?? current.days ?? [],
        timeNotes: data.availability.timeNotes ?? current.timeNotes ?? '',
        isAcceptingStudents: data.availability.isAcceptingStudents ?? current.isAcceptingStudents ?? true,
      };
    } else {
      user[profileKey][key] = data[key];
    }
  }
}

const MENTOR_FIELDS = [
  'title', 'bio', 'skills', 'expertise', 'yearsOfExperience', 'education',
  'workExperience', 'availability', 'categories', 'mentoringApproach',
];

// PUT /api/mentors/profile (mentor only)
export const updateMentorProfile = asyncHandler(async (req, res) => {
  const data = matchedData(req, { locations: ['body'], includeOptionals: false });
  applyProfileUpdate(req.user, data, 'mentorProfile', MENTOR_FIELDS);
  await req.user.save();
  ok(res, { user: req.user.toSafeJSON(), profileCompletion: req.user.profileCompletion() }, 'Profile updated');
});
