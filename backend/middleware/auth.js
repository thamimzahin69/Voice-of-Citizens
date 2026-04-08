const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'replace-this-secret-in-prod';

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  const token = auth.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.userId).lean();
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    
    // ✅ Add an `id` alias for convenience (used in electionsController)
    user.id = user._id.toString();
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  JWT_SECRET,
};