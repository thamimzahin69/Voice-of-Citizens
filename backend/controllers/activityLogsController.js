const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { recordActivityLog } = require('../services/activityLogService');

async function createActivityLog(req, res, next) {
  try {
    const { eventType, action, details = '', metadata = {} } = req.body;

    if (!eventType || !action) {
      return res.status(422).json({ message: 'eventType and action are required' });
    }

    const log = await recordActivityLog({
      userId: req.user._id,
      eventType,
      action,
      details,
      metadata,
      ipAddress: req.ip,
      source: 'frontend',
    });

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

async function listMyActivityLogs(req, res, next) {
  try {
    const logs = await ActivityLog.find({ user: req.user._id })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    next(err);
  }
}

async function listActivityLogs(req, res, next) {
  try {
    const filter = {};
    if (req.query.userId) {
      filter.user = req.query.userId;
    }

    const logs = await ActivityLog.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    next(err);
  }
}

async function listActivityLogUsers(req, res, next) {
  try {
    const users = await User.find().select('name email role createdAt').sort({ name: 1 });

    const counts = await ActivityLog.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 }, lastActivity: { $max: '$createdAt' } } },
    ]);

    const countMap = counts.reduce((acc, item) => {
      acc[item._id.toString()] = {
        count: item.count,
        lastActivity: item.lastActivity,
      };
      return acc;
    }, {});

    res.json(
      users.map((user) => ({
        ...user.toObject(),
        logCount: countMap[user._id.toString()]?.count || 0,
        lastActivity: countMap[user._id.toString()]?.lastActivity || null,
      }))
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createActivityLog,
  listMyActivityLogs,
  listActivityLogs,
  listActivityLogUsers,
};