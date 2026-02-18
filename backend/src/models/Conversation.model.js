import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String, required: true },
    lastMessage: { type: String, default: '' },
    lastMessageTime: { type: String },
    unreadCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ partnerId: 1, customerId: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
