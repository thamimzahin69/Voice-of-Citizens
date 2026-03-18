const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    nid: { type: String, trim: true },
    documentPath: { type: String },
  },
  { timestamps: true }
);

userSchema.virtual('password').set(function (val) {
  this.passwordHash = bcrypt.hashSync(val, 10);
});

userSchema.methods.verifyPassword = function (password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
