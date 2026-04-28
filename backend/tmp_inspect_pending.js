require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const pending = await User.find({ documentStatus: 'pending' }).lean().limit(50);
    console.log('PENDING_COUNT', pending.length);
    pending.forEach((u) => {
      console.log(JSON.stringify({ email: u.email, role: u.role, forcePasswordReset: u.forcePasswordReset, documentStatus: u.documentStatus, documentPath: u.documentPath, createdAt: u.createdAt }));
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
