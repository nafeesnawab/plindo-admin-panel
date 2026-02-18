import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminName: { type: String },
    action: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    level: { type: String, enum: ['info', 'warning', 'error', 'critical'], default: 'info' },
    category: { type: String, enum: ['activity', 'error', 'payment', 'api'], default: 'activity', index: true },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ adminId: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
