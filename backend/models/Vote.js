const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    voter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

const Vote = mongoose.model('Vote', voteSchema);
module.exports = Vote;
