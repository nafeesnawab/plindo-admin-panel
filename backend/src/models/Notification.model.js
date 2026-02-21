import mongoose from 'mongoose';

const notificationStatsSchema = new mongoose.Schema({
  sentCount: { type: Number, default: 0 },
  deliveredCount: { type: Number, default: 0 },
  openedCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  openRate: { type: Number, default: 0 },
  deliveryRate: { type: Number, default: 0 },
}, { _id: false });

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    recipientType: {
      type: String,
      enum: ['all_users', 'all_customers', 'all_partners', 'specific_user'],
      required: true,
    },
    recipientId: { type: String },
    recipientName: { type: String, default: null },
    notificationType: {
      type: String,
      enum: ['push', 'email', 'both'],
      default: 'push',
    },
    scheduledAt: { type: Date, default: null },
    sentAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'partial'],
      default: 'sent',
    },
    stats: { type: notificationStatsSchema, default: () => ({}) },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
