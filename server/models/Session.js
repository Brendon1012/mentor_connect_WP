import mongoose from 'mongoose';
import { SESSION_STATUS } from '../utils/constants.js';

const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    request: { type: Schema.Types.ObjectId, ref: 'MentorshipRequest', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, min: 15, max: 240, default: 60 },
    meetingUrl: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (v) => !v || /^https?:\/\/\S+$/i.test(v),
        message: 'Meeting link must start with http:// or https://',
      },
    },
    status: { type: String, enum: SESSION_STATUS, default: 'scheduled' },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rescheduledCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
