const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

async function register(req, res, next) {
  try {
    const { name, email, password, nid, age, gender, address, locality } = req.body;

    // Basic validation
    if (!name || !email || !password || !nid) {
      return res.status(422).json({ message: 'All required fields must be filled' });
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