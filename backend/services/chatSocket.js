const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');
const { JWT_SECRET } = require('../middleware/auth');
const { recordActivityLog } = require('./activityLogService');

const conversationPopulate = [
  { path: 'user', select: 'name email role documentStatus' },
  { path: 'admin', select: 'name email role' },
  { path: 'closedBy', select: 'name email role' },
];

const messagePopulate = { path: 'sender', select: 'name email role' };

async function authorizeSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authorization required'));

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.userId).select('-passwordHash -anonymousHash').lean();
    if (!user) return next(new Error('Invalid token'));

    user.id = user._id.toString();
    socket.user = user;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
}

async function canAccessConversation(user, conversationId) {
  const conversation = await ChatConversation.findById(conversationId);
  if (!conversation) return null;
  if (user.role === 'admin' || conversation.user.toString() === user._id.toString()) {
    return conversation;
  }
  return null;
}

function registerChatSocket(io) {
  io.use(authorizeSocket);

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
    if (socket.user.role === 'admin') {
      socket.join('admins');
    }

    socket.on('conversation:join', async ({ conversationId } = {}, ack) => {
      try {
        const conversation = await canAccessConversation(socket.user, conversationId);
        if (!conversation) throw new Error('Conversation not found');
        socket.join(`conversation:${conversation._id}`);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, message: err.message });
      }
    });

    socket.on('message:send', async ({ conversationId, body } = {}, ack) => {
      try {
        const text = (body || '').trim();
        if (!text) throw new Error('Message cannot be empty');
        if (text.length > 2000) throw new Error('Message is too long');

        let conversation;
        if (conversationId) {
          conversation = await canAccessConversation(socket.user, conversationId);
        } else if (socket.user.role !== 'admin') {
          conversation = await ChatConversation.findOne({ user: socket.user._id, status: 'open' });
          if (!conversation) {
            conversation = await ChatConversation.create({
              user: socket.user._id,
              subject: 'Support chat',
              lastMessageAt: new Date(),
            });
          }
        }

        if (!conversation) throw new Error('Conversation not found');
        if (conversation.status === 'closed') throw new Error('This conversation is closed');

        if (socket.user.role === 'admin' && !conversation.admin) {
          conversation.admin = socket.user._id;
        }
        conversation.lastMessage = text;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        const message = await ChatMessage.create({
          conversation: conversation._id,
          sender: socket.user._id,
          body: text,
          readBy: [socket.user._id],
        });

        await message.populate(messagePopulate);
        await conversation.populate(conversationPopulate);

        io.to(`conversation:${conversation._id}`).emit('message:new', message);
        io.to(`user:${conversation.user._id || conversation.user}`).emit('message:new', message);
        io.to('admins').emit('message:new', message);
        io.to(`conversation:${conversation._id}`).emit('conversation:updated', conversation);
        io.to('admins').emit('conversation:updated', conversation);
        io.to(`user:${conversation.user._id || conversation.user}`).emit('conversation:updated', conversation);

        recordActivityLog({
          userId: socket.user._id,
          eventType: 'chat',
          action: socket.user.role === 'admin' ? 'Replied to chat' : 'Sent chat message',
          details: text,
          metadata: { conversationId: conversation._id.toString() },
          source: 'socket',
        }).catch(() => null);

        ack?.({ ok: true, conversation, message });
      } catch (err) {
        ack?.({ ok: false, message: err.message });
      }
    });
  });
}

module.exports = registerChatSocket;
