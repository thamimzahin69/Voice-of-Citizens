const ActivityLog = require('../models/ActivityLog');

async function recordActivityLog({
  userId,
  eventType,
  action,
  details = '',
  metadata = {},
  ipAddress = '',
  source = 'backend',
}) {
  if (!userId || !eventType || !action) {
    return null;
  }

  return ActivityLog.create({
    user: userId,
    eventType,
    action,
    details,
    metadata,
    ipAddress,
    source,
  });
}

module.exports = {
  recordActivityLog,
};