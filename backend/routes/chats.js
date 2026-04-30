const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  createConversation,
  getOrCreateMyConversation,
  listConversations,
  listMessages,
  closeConversation,
} = require('../controllers/chatController');

const router = express.Router();

router.get('/', requireAuth, listConversations);
router.post('/', requireAuth, createConversation);
router.get('/me', requireAuth, getOrCreateMyConversation);
router.get('/:conversationId/messages', requireAuth, listMessages);
router.patch('/:conversationId/close', requireAuth, requireAdmin, closeConversation);

module.exports = router;
