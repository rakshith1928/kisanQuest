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

AnalyticsSchema.index({ playerId: 1 });
AnalyticsSchema.index({ eventName: 1 });
AnalyticsSchema.index({ createdAt: -1 });

export default mongoose.model('Analytics', AnalyticsSchema);
