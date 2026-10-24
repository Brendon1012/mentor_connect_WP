import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    read: { type: Boolean, default: false },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Speeds up loading a conversation in time order.
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
