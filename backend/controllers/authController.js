const jwt = require('jsonwebtoken');
const path = require('path');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');
const { recordActivityLog } = require('../services/activityLogService');

function generateToken(user) {
  return jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

async function register(req, res, next) {
  try {
    const { name, email, password, nid, age, gender, address, locality, area } = req.body;

    // Basic validation
    if (!name || !email || !password || !nid || !area) {
      return res.status(422).json({ message: 'All required fields must be filled (name, email, password, nid, area)' });
    }

    if (password.length < 6) {
      return res.status(422).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if email is valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(422).json({ message: 'Invalid email format' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Check if NID already exists
    const existingNid = await User.findOne({ nid });
    if (existingNid) {
      return res.status(409).json({ message: 'NID already registered' });
    }

    const user = new User({ 
      name, 
      email, 
      nid,
      area,
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
      address: address || undefined,
      locality: locality || undefined,
    });

    // Make the first registered user an admin for initial setup
    const existingUsers = await User.countDocuments();
    if (existingUsers === 0) {
      user.role = 'admin';
      user.documentStatus = 'verified';
    }

    user.password = password;

    if (req.file) {
      user.documentPath = path.basename(req.file.path);
    }

    await user.save();

    if (user.documentStatus === 'verified') {
      const token = generateToken(user);
      return res.json({
        user: user.toJSON(),
        token,
        mustResetPassword: Boolean(user.forcePasswordReset),
      });
    }

    return res.status(201).json({
      message: 'Registration request submitted. Your account will be activated after admin approval.',
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.verifyPassword(password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.documentStatus !== 'verified' && user.role !== 'admin') {
      const message = user.documentStatus === 'pending'
        ? 'Account pending admin approval.'
        : 'Registration rejected by admin.';
      return res.status(403).json({ message });
    }

    const token = generateToken(user);

    recordActivityLog({
      userId: user._id,
      eventType: 'login',
      action: 'Logged in',
      details: `Signed in as ${user.email}`,
      ipAddress: req.ip,
    }).catch(() => null);

    res.json({
      user: user.toJSON(),
      token,
      mustResetPassword: Boolean(user.forcePasswordReset),
    });
  } catch (err) {
    next(err);
  }
}

async function completeProfile(req, res, next) {
  try {
    const { password, nid } = req.body;

    if (!password || !nid) {
      return res.status(422).json({ message: 'Password and NID are required' });
    }

    if (password.length < 6) {
      return res.status(422).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingNid = await User.findOne({ nid, _id: { $ne: user._id } });
    if (existingNid) {
      return res.status(409).json({ message: 'NID already registered' });
    }

    user.password = password;
    user.nid = nid;
    user.forcePasswordReset = false;
    user.documentStatus = 'pending';

    if (req.file) {
      user.documentPath = path.basename(req.file.path);
    }

    await user.save();

    res.json({ message: 'Profile completed successfully', user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  completeProfile,
};