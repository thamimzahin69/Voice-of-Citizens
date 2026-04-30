const Complaint = require('../models/Complaint');
const { recordActivityLog } = require('../services/activityLogService');

async function listComplaints(req, res, next) {
  try {
    const items = await Complaint.find()
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function createComplaint(req, res, next) {
  try {
    const subject = (req.body.subject || req.body.text || '').trim();
    const description = (req.body.description || req.body.text || '').trim();

    // Validation
    if (!subject || !description) {
      return res.status(422).json({ message: 'Subject and description are required' });
    }

    const complaint = await Complaint.create({
      subject,
      description,
      submittedBy: req.user._id,
      relatedElection: (req.body.election || req.body.relatedElection || '').trim() || undefined,
      attachmentPath: req.file?.path,
    });

    await complaint.populate('submittedBy', 'name email');

    recordActivityLog({
      userId: req.user._id,
      eventType: 'complaint',
      action: 'Submitted complaint',
      details: subject,
      metadata: { complaintId: complaint._id.toString() },
      ipAddress: req.ip,
    }).catch(() => null);

    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listComplaints,
  createComplaint,
};
