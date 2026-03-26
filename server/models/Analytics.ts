import mongoose from 'mongoose';

const AnalyticsSchema = new mongoose.Schema({
  playerId: {
    type: String,
    default: 'anonymous'
  },
  eventName: {
    type: String,
    required: true
  },
  eventData: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Analytics', AnalyticsSchema);
