const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  createActivityLog,
  listMyActivityLogs,
  listActivityLogs,
  listActivityLogUsers,
} = require('../controllers/activityLogsController');

const router = express.Router();

router.post('/', requireAuth, createActivityLog);
router.get('/me', requireAuth, listMyActivityLogs);
router.get('/users', requireAuth, requireAdmin, listActivityLogUsers);
router.get('/', requireAuth, requireAdmin, listActivityLogs);

module.exports = router;