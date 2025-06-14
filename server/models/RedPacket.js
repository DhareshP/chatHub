import mongoose from 'mongoose';

const redPacketSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  count: {
    type: Number,
    required: true
  },
  allocations: [{
    type: Number
  }],
  claimedCount: {
    type: Number,
    default: 0
  },
  claims: [{
    user: String,
    amount: Number,
    claimedAt: {
      type: Date,
      default: Date.now
    }
  }],
  message: {
    type: String,
    default: '恭喜发财，大吉大利！'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active'
  }
}, {
  timestamps: true
});

export default mongoose.model('RedPacket', redPacketSchema);