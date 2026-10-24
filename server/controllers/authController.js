import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { ok, created, asyncHandler } from '../utils/respond.js';
import { setAuthCookie, clearAuthCookie } from '../utils/token.js';

function userPayload(user) {
  return { user: user.toSafeJSON(), profileCompletion: user.profileCompletion() };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, college, department, yearOfStudy, skills = [], expertise = [] } = req.body;

  // Friendly check first; the unique index on email is the real guarantee (race-safe).
  if (await User.exists({ email })) {
    throw new AppError(409, 'An account with this email already exists', [
      { field: 'email', message: 'An account with this email already exists' },
    ]);
  }

  const user = new User({ name, email, role, college, department });
  if (role === 'student') {
    user.studentProfile = { yearOfStudy, skills };
  } else {
    user.mentorProfile = { skills, expertise };
  }
  await user.setPassword(password);
  await user.save();

  setAuthCookie(res, user._id);
  created(res, userPayload(user), 'Account created successfully');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');

  // Same message whether the email or the password is wrong, so attackers
  // cannot find out which emails are registered.
  if (!user || !(await user.checkPassword(password))) {
    throw new AppError(401, 'Invalid email or password');
  }

  setAuthCookie(res, user._id);
  ok(res, userPayload(user), 'Logged in successfully');
});

export const logout = (req, res) => {
  clearAuthCookie(res);
  ok(res, undefined, 'Logged out');
};

export const me = (req, res) => {
  ok(res, userPayload(req.user));
};

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.checkPassword(req.body.currentPassword))) {
    throw new AppError(400, 'Current password is incorrect', [
      { field: 'currentPassword', message: 'Current password is incorrect' },
    ]);
  }
  await user.setPassword(req.body.newPassword);
  await user.save();
  ok(res, undefined, 'Password updated successfully');
});
