import mongoose from 'mongoose';
import { CATEGORIES, REQUEST_STATUS } from '../utils/constants.js';

const { Schema } = mongoose;

const requestSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, enum: CATEGORIES, required: true },
    goals: { type: String, required: true, trim: true, minlength: 20, maxlength: 1000 },
    status: { type: String, enum: REQUEST_STATUS, default: 'pending' },
    mentorResponse: { type: String, trim: true, maxlength: 500, default: '' },
    respondedAt: Date,
    completedAt: Date,
    // Optional feedback the student leaves once the mentorship is completed.
    review: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true, maxlength: 500 },
      createdAt: Date,
    },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Database-level guarantee: at most one *active* (pending/accepted) request per student-mentor pair.
// Rejected or completed requests are excluded, so the student can ask again later.
requestSchema.index(
  { student: 1, mentor: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'accepted'] } } }
);

export default mongoose.model('MentorshipRequest', requestSchema);
