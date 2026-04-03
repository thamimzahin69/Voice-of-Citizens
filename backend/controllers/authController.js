const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, email, password, nid, age, gender, address, locality } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = new User({ 
      name, 
      email, 
      nid,
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
      address: address || undefined,
      locality: locality || undefined,
    });

    // Make the first registered user an admin for initial setup
    const existingUsers = await User.countDocuments();
    if (existingUsers === 0) {
      user.role = 'admin';
    }

    user.password = password;

    if (req.file) {
      user.documentPath = req.file.path;
    }

    await user.save();

    const token = generateToken(user);
    res.json({ user: user.toJSON(), token });
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

    const token = generateToken(user);
    res.json({ user: user.toJSON(), token });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
};
