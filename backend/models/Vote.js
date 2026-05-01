const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    // For majority voting: single candidate reference
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
    // For rank-based voting: ordered array of candidate ids (first choice first)
    ranked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' }],
    voter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    anonymousHash: { type: String }, // Hashed identifier for anonymous vote tracking
    ipAddress: { type: String },
  },
  { timestamps: true }
);

// keeps ur private type shit 
voteSchema.index({ election: 1, voter: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);
module.exports = Vote;
