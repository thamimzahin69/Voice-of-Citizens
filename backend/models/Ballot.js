const mongoose = require('mongoose');

const ballotSchema = new mongoose.Schema(
  {
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    locality: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    assignedVoters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    totalVoterCount: { type: Number, default: 0 },
    votedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Autocalculate totals
ballotSchema.pre('save', async function (next) {
  if (this.assignedVoters.length > 0) {
    this.totalVoterCount = this.assignedVoters.length;
    // Count how many have voted
    const Vote = mongoose.model('Vote');
    this.votedCount = await Vote.countDocuments({
      election: this.election,
      voter: { $in: this.assignedVoters },
    });
  }
  next();
});

const Ballot = mongoose.model('Ballot', ballotSchema);
module.exports = Ballot;
