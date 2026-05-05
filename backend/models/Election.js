const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema(
  {
    type: { type: String, default: 'custom' },
    mode: { type: String, enum: ['actual', 'testing'], default: 'actual' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    votingType: { type: String, enum: ['majority', 'rankBased'], required: true },
    area: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    totalRegisteredVoters: { type: Number, default: 0 },
    totalVotesCast: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const Election = mongoose.model('Election', electionSchema);
module.exports = Election;