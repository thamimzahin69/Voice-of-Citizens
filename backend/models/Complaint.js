const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    status: { type: String, enum: ['open', 'in-review', 'resolved'], default: 'open' },
    response: { type: String, default: '' },
  },
  { timestamps: true }
);

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
