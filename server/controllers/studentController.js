import { matchedData } from 'express-validator';
import { ok, asyncHandler } from '../utils/respond.js';
import { applyProfileUpdate } from './mentorController.js';

const STUDENT_FIELDS = ['yearOfStudy', 'skills', 'careerInterests', 'learningGoals'];

// GET /api/students/profile
export const getStudentProfile = (req, res) => {
  ok(res, { user: req.user.toSafeJSON(), profileCompletion: req.user.profileCompletion() });
};

// PUT /api/students/profile
export const updateStudentProfile = asyncHandler(async (req, res) => {
  const data = matchedData(req, { locations: ['body'], includeOptionals: false });
  applyProfileUpdate(req.user, data, 'studentProfile', STUDENT_FIELDS);
  await req.user.save();
  ok(res, { user: req.user.toSafeJSON(), profileCompletion: req.user.profileCompletion() }, 'Profile updated');
});
