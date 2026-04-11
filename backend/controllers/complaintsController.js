const Complaint = require('../models/Complaint');

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
    const { subject, description } = req.body;

    // Validation
    if (!subject || !description) {
      return res.status(422).json({ message: 'Subject and description are required' });
    }

    const complaint = await Complaint.create({
      subject,
      description,
      submittedBy: req.user._id,
    });

    await complaint.populate('submittedBy', 'name email');
    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listComplaints,
  createComplaint,
};
