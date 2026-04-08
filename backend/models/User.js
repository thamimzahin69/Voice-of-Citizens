const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    // NID is now required and unique
    nid: { type: String, required: true, unique: true, trim: true },
    documentPath: { type: String },
    documentStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    documentVerifiedAt: { type: Date },
    documentVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    age: { type: Number, min: 18, max: 120 },
    gender: { type: String, enum: ['male', 'female', 'other', ''] },
    address: { type: String, trim: true },
    locality: { type: String, trim: true },
    anonymousHash: { type: String, unique: true },
    joinedElections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Election' }]
  },
  { timestamps: true }
);

userSchema.pre('save', function (next) {
  if (!this.anonymousHash) {
    // Generate anonymous hash using NID + timestamp + random
    this.anonymousHash = crypto
      .createHash('sha256')
      .update(this.nid + Date.now() + Math.random().toString())
      .digest('hex');
  }
  next();
});

userSchema.virtual('password').set(function (val) {
  this.passwordHash = bcrypt.hashSync(val, 10);
});

userSchema.methods.verifyPassword = function (password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.anonymousHash;
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;