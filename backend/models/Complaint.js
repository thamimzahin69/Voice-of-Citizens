const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Reviewed', 'Resolved'], default: 'Pending' },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    relatedElection: { type: String, trim: true },
    attachmentPath: { type: String },
  },
  { timestamps: true }
);

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
