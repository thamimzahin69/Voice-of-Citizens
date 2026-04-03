const Ballot = require('../models/Ballot');
const User = require('../models/User');
const Election = require('../models/Election');

// Create a ballot for a specific locality/election
async function createBallot(req, res, next) {
  try {
    const { electionId, locality, description } = req.body;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check if ballot already exists for this election and locality
    const existing = await Ballot.findOne({ election: electionId, locality });
    if (existing) {
      return res.status(409).json({ message: 'Ballot already exists for this locality' });
    }

    const ballot = await Ballot.create({
      election: electionId,
      locality,
      description: description || `Ballot for ${locality}`,
    });

    res.status(201).json(ballot);
  } catch (err) {
    next(err);
  }
}

// Auto-assign voters to ballots based on their locality
async function autoAssignVotersToBallotsForElection(req, res, next) {
  try {
    const { electionId } = req.params;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Get all verified users with locality info
    const voters = await User.find({
      documentStatus: 'verified',
      locality: { $exists: true, $ne: '' },
    });

    if (voters.length === 0) {
      return res.json({ message: 'No verified voters with locality information', assigned: 0 });
    }

    // Group voters by locality
    const votersByLocality = {};
    voters.forEach((voter) => {
      if (!votersByLocality[voter.locality]) {
        votersByLocality[voter.locality] = [];
      }
      votersByLocality[voter.locality].push(voter._id);
    });

    // Create or update ballots for each locality
    const createdBallots = [];
    let totalAssigned = 0;

    for (const [locality, voterIds] of Object.entries(votersByLocality)) {
      let ballot = await Ballot.findOne({ election: electionId, locality });

      if (!ballot) {
        ballot = await Ballot.create({
          election: electionId,
          locality,
          description: `Ballot for ${locality}`,
        });
      }

      // Assign voters to ballot
      ballot.assignedVoters = voterIds;
      ballot.totalVoterCount = voterIds.length;
      await ballot.save();

      createdBallots.push(ballot);
      totalAssigned += voterIds.length;
    }

    res.json({
      message: 'Voters auto-assigned to ballots',
      electionId,
      ballotsCreated: createdBallots.length,
      votersAssigned: totalAssigned,
      ballots: createdBallots,
    });
  } catch (err) {
    next(err);
  }
}

// Get all ballots for an election
async function getBallotsForElection(req, res, next) {
  try {
    const { electionId } = req.params;

    const ballots = await Ballot.find({ election: electionId })
      .populate('election', 'title')
      .populate('assignedVoters', 'name email locality');

    res.json(ballots);
  } catch (err) {
    next(err);
  }
}

// Get specific ballot with voter details
async function getBallotDetails(req, res, next) {
  try {
    const { ballotId } = req.params;

    const ballot = await Ballot.findById(ballotId)
      .populate('election', 'title')
      .populate('assignedVoters', 'name email locality');

    if (!ballot) {
      return res.status(404).json({ message: 'Ballot not found' });
    }

    const turnoutPercent = ballot.totalVoterCount > 0 ? ((ballot.votedCount / ballot.totalVoterCount) * 100).toFixed(2) : 0;

    res.json({
      ...ballot.toObject(),
      turnoutPercent,
    });
  } catch (err) {
    next(err);
  }
}

// Get user's assigned ballot for an election
async function getUserAssignedBallot(req, res, next) {
  try {
    const { electionId } = req.params;
    const userId = req.user._id;

    const ballot = await Ballot.findOne({
      election: electionId,
      assignedVoters: userId,
    }).populate('election', 'title');

    if (!ballot) {
      return res.status(404).json({ message: 'No ballot assigned for this election' });
    }

    res.json(ballot);
  } catch (err) {
    next(err);
  }
}

// Get voting turnout by ballot/locality
async function getBallotTurnout(req, res, next) {
  try {
    const { electionId } = req.params;

    const ballots = await Ballot.find({ election: electionId });

    const turnout = ballots.map((ballot) => ({
      locality: ballot.locality,
      totalVoters: ballot.totalVoterCount,
      votedCount: ballot.votedCount,
      turnoutPercent: ballot.totalVoterCount > 0 ? ((ballot.votedCount / ballot.totalVoterCount) * 100).toFixed(2) : 0,
    }));

    res.json({
      electionId,
      ballots: turnout,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBallot,
  autoAssignVotersToBallotsForElection,
  getBallotsForElection,
  getBallotDetails,
  getUserAssignedBallot,
  getBallotTurnout,
};
