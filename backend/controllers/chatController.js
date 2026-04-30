const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');

const conversationPopulate = [
  { path: 'user', select: 'name email role documentStatus' },
  { path: 'admin', select: 'name email role' },
  { path: 'closedBy', select: 'name email role' },
];

const messagePopulate = { path: 'sender', select: 'name email role' };

async function getOrCreateMyConversation(req, res, next) {
  try {
    let conversation = await ChatConversation.findOne({
      user: req.user._id,
      status: 'open',
    }).populate(conversationPopulate);

    if (!conversation) {
      conversation = await ChatConversation.create({
        user: req.user._id,
        subject: req.body.subject || 'Support chat',
        lastMessageAt: new Date(),
      });
      await conversation.populate(conversationPopulate);
    }

    res.json(conversation);
  } catch (err) {
    next(err);
  }
}

async function createConversation(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins reply to user-created chats from the inbox.' });
    }

    const subject = (req.body.subject || 'Support chat').trim();
    const firstMessage = (req.body.message || '').trim();

    if (!subject) {
      return res.status(422).json({ message: 'Chat subject is required' });
    }

    const conversation = await ChatConversation.create({
      user: req.user._id,
      subject,
      lastMessage: firstMessage,
      lastMessageAt: new Date(),
    });

    let message = null;
    if (firstMessage) {
      message = await ChatMessage.create({
        conversation: conversation._id,
        sender: req.user._id,
        body: firstMessage,
        readBy: [req.user._id],
      });
      await message.populate(messagePopulate);
    }

    await conversation.populate(conversationPopulate);

    req.app.get('io')?.to('admins').emit('conversation:created', conversation);
    req.app.get('io')?.to('admins').emit('conversation:updated', conversation);
    req.app.get('io')?.to(`user:${req.user._id}`).emit('conversation:created', conversation);
    req.app.get('io')?.to(`user:${req.user._id}`).emit('conversation:updated', conversation);

    if (message) {
      req.app.get('io')?.to('admins').emit('message:new', message);
      req.app.get('io')?.to(`user:${req.user._id}`).emit('message:new', message);
    }

    res.status(201).json({ conversation, message });
  } catch (err) {
    next(err);
  }
}

async function listConversations(req, res, next) {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    const conversations = await ChatConversation.find(filter)
      .populate(conversationPopulate)
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    next(err);
  }
}

async function listMessages(req, res, next) {
  try {
    const conversation = await ChatConversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isOwner = conversation.user.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'You cannot view this conversation' });
    }

    const messages = await ChatMessage.find({ conversation: conversation._id })
      .populate(messagePopulate)
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    next(err);
  }
}

async function closeConversation(req, res, next) {
  try {
    const conversation = await ChatConversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    conversation.status = 'closed';
    conversation.closedAt = new Date();
    conversation.closedBy = req.user._id;
    await conversation.save();
    await conversation.populate(conversationPopulate);

    req.app.get('io')?.to(`conversation:${conversation._id}`).emit('conversation:updated', conversation);
    req.app.get('io')?.to('admins').emit('conversation:updated', conversation);

    res.json(conversation);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createConversation,
  getOrCreateMyConversation,
  listConversations,
  listMessages,
  closeConversation,
};
