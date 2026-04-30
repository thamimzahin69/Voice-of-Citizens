const mongoose = require('mongoose');

const chatConversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subject: { type: String, trim: true, default: 'Support chat' },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    lastMessage: { type: String, trim: true, default: '' },
    lastMessageAt: { type: Date },
    closedAt: { type: Date },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

chatConversationSchema.index({ user: 1, status: 1 });
chatConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
