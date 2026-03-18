const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    name: { type: String, required: true },
    party: { type: String, default: '' },
    manifesto: { type: String, default: '' },
    voteCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Candidate = mongoose.model('Candidate', candidateSchema);
module.exports = Candidate;
