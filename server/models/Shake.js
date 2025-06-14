import mongoose from 'mongoose';

const shakeSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  deviceInfo: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Shake', shakeSchema);