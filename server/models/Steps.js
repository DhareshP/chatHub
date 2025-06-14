import mongoose from 'mongoose';

const stepsSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true // Format: YYYY-MM-DD
  }
}, {
  timestamps: true
});

stepsSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('Steps', stepsSchema);