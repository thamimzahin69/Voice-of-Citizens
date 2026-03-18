const Election = require('../models/Election');
const Vote = require('../models/Vote');
const Complaint = require('../models/Complaint');

async function overview(req, res, next) {
  try {
    const now = new Date();
    const activeElections = await Election.countDocuments({ startDate: { $lte: now }, endDate: { $gte: now } });
    const yourVotes = await Vote.countDocuments({ voter: req.user._id });
    const openComplaints = await Complaint.countDocuments({ status: 'open' });

    res.json({
      activeElections,
      yourVotes,
      openComplaints,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  overview,
};
