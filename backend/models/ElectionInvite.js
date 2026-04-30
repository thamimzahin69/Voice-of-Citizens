const mongoose = require('mongoose');

const electionInviteSchema = new mongoose.Schema(
  {
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    invitedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date }
  },
  { timestamps: true }
);

// Create a compound unique index on election and user
electionInviteSchema.index({ election: 1, user: 1 }, { unique: true });

const ElectionInvite = mongoose.model('ElectionInvite', electionInviteSchema);
module.exports = ElectionInvite;
