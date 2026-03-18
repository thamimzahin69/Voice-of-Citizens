const Complaint = require('../models/Complaint');

async function listComplaints(req, res, next) {
  try {
    const items = await Complaint.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function createComplaint(req, res, next) {
  try {
    const { text } = req.body;
    const complaint = await Complaint.create({ user: req.user._id, text });
    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listComplaints,
  createComplaint,
};
