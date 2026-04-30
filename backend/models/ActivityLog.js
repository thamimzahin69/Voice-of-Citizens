const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventType: {
      type: String,
      enum: ['login', 'logout', 'vote', 'complaint', 'chat', 'profile', 'admin', 'system'],
      required: true,
      index: true,
    },
    action: { type: String, required: true, trim: true },
    details: { type: String, default: '', trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: '' },
    source: { type: String, enum: ['backend', 'frontend'], default: 'backend' },
  },
  { timestamps: true }
);

activityLogSchema.index({ user: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;