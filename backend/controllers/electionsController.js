// backend/controllers/electionsController.js

const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const User = require('../models/User');
const { recordActivityLog } = require('../services/activityLogService');

// ==================== EXISTING FUNCTIONS (preserved) ====================

async function createElection(req, res, next) {
  try {
    const { type, title, description, startDate, endDate } = req.body;

    const election = await Election.create({
      type,
      title,
      description,
      startDate,
      endDate,
      createdBy: "65f0a1b2c3d4e5f6a7b8c9d0", // or req.user._id
    });

    const candidatesPayload = req.body.candidates ? JSON.parse(req.body.candidates) : [];
    const files = (req.files?.candidateImages || []).slice();

    const createdCandidates = [];

    for (const candidateData of candidatesPayload) {
      const candidate = new Candidate({
        election: election._id,
        name: candidateData.name,
        party: candidateData.party,
        manifesto: candidateData.manifesto,
      });

      const file = files.shift();
      if (file) {
        candidate.imagePath = file.path;
      }

      await candidate.save();
      createdCandidates.push(candidate);
    }

    res.status(201).json({ ...election.toObject(), candidates: createdCandidates });
  } catch (err) {
    next(err);
  }
}

async function getElection(req, res, next) {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    res.json(election);
  } catch (err) {
    next(err);
  }
}

async function listAllElections(req, res, next) {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    res.json(elections);
  } catch (err) {
    next(err);
  }
}

async function listActiveElections(req, res, next) {
  try {
    const now = new Date();
    const elections = await Election.find({ startDate: { $lte: now }, endDate: { $gte: now } }).sort({ startDate: -1 });
    res.json(elections);
  } catch (err) {
    next(err);
  }
}

async function listHistory(req, res, next) {
  try {
    const now = new Date();
    const elections = await Election.find({ endDate: { $lt: now } }).sort({ endDate: -1 });
    res.json(elections);
  } catch (err) {
    next(err);
  }
}

async function listCandidates(req, res, next) {
  try {
    const candidates = await Candidate.find({ election: req.params.id });
    res.json(candidates);
  } catch (err) {
    next(err);
  }
}

async function listManifestos(req, res, next) {
  try {
    const candidates = await Candidate.find({ election: req.params.id });
    const manifestos = candidates.map((c) => ({
      _id: c._id,
      candidateName: c.name,
      manifesto: c.manifesto,
    }));
    res.json(manifestos);
  } catch (err) {
    next(err);
  }
}

async function results(req, res, next) {
  try {
    const candidates = await Candidate.find({ election: req.params.id });
    const totalVotes = candidates.reduce((acc, c) => acc + (c.voteCount ?? 0), 0);

    const results = candidates.map((c) => ({
      candidateId: c._id,
      candidateName: c.name,
      votes: c.voteCount ?? 0,
      sharePercent: totalVotes ? ((c.voteCount ?? 0) / totalVotes) * 100 : 0,
    }));

    res.json(results);
  } catch (err) {
    next(err);
  }
}

async function predictions(req, res, next) {
  try {
    const candidates = await Candidate.find();
    const grouped = candidates.reduce((acc, c) => {
      const key = c.election.toString();
      acc[key] = acc[key] || { electionId: key, electionTitle: '', candidates: [] };
      acc[key].candidates.push(c);
      return acc;
    }, {});

    const data = Object.values(grouped).map((group) => {
      const total = group.candidates.reduce((sum, c) => sum + (c.voteCount ?? 0), 0);
      const leading = group.candidates.reduce((best, c) => {
        if (!best || (c.voteCount ?? 0) > (best.voteCount ?? 0)) return c;
        return best;
      }, null);

      return {
        electionId: group.electionId,
        electionTitle: `Election ${group.electionId.slice(-5)}`,
        leadingCandidate: leading?.name ?? 'No votes yet',
        winProbability: total ? Math.round(((leading?.voteCount ?? 0) / total) * 100) : 0,
      };
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getJoinableElections(req, res, next) {
  try {
    const userId = req.user.id;
    const now = new Date();

    const elections = await Election.find({
      endDate: { $gt: now },
      isPublished: true,
    }).select('title description startDate endDate');

    const votes = await Vote.find({ voter: userId }).distinct('election');

    const enriched = elections.map(election => ({
      ...election.toObject(),
      joined: election.voters?.includes(userId) || false,
      hasVoted: votes.includes(election._id.toString()),
    }));

    res.json(enriched);
  } catch (err) {
    next(err);
  }
}

async function joinElection(req, res, next) {
  try {
    const electionId = req.params.id;
    const userId = req.user.id;

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ msg: 'Election not found' });

    const now = new Date();
    if (election.endDate <= now) {
      return res.status(400).json({ msg: 'Cannot join – deadline passed' });
    }

    const existingVote = await Vote.findOne({ election: electionId, voter: userId });
    if (existingVote) {
      return res.status(400).json({ msg: 'You have already voted in this election' });
    }

    if (election.voters.includes(userId)) {
      return res.status(400).json({ msg: 'You have already joined' });
    }

    election.voters.push(userId);
    await election.save();

    await User.findByIdAndUpdate(userId, {
      $addToSet: { joinedElections: electionId }
    });

    res.json({ msg: 'Successfully joined election', electionId: election._id });
  } catch (err) {
    next(err);
  }
}

async function getElectionStatus(req, res, next) {
  try {
    const electionId = req.params.id;
    const userId = req.user.id;

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ msg: 'Election not found' });

    const joined = election.voters?.includes(userId) || false;
    const hasVoted = !!(await Vote.findOne({ election: electionId, voter: userId }));

    res.json({ joined, hasVoted });
  } catch (err) {
    next(err);
  }
}

// ==================== NEW FUNCTIONS FOR REQUIREMENT ====================

// @desc    Get all elections for logged-in user (enriched with status, hasVoted, candidateCount)
// @route   GET /api/elections
// @access  Private
async function getAllElections(req, res, next) {
  try {
    const userId = req.user.id;
    const elections = await Election.find().select('-__v').lean();

    const now = new Date();
    const enrichedElections = await Promise.all(elections.map(async (election) => {
      let status = 'upcoming';
      if (now >= election.startDate && now <= election.endDate) status = 'active';
      else if (now > election.endDate) status = 'finished';

      const hasVoted = await Vote.exists({ voter: userId, election: election._id });
      const candidateCount = await Candidate.countDocuments({ election: election._id });

      return {
        ...election,
        status,
        hasVoted: !!hasVoted,
        candidateCount,
      };
    }));

    res.json(enrichedElections);
  } catch (err) {
    next(err);
  }
}

// @desc    Get single election details with candidates, vote counts, leaderboard, winner
// @route   GET /api/elections/:id
// @access  Private
async function getElectionById(req, res, next) {
  try {
    const electionId = req.params.id;
    const userId = req.user.id;

    const election = await Election.findById(electionId).lean();
    if (!election) return res.status(404).json({ message: 'Election not found' });

    const now = new Date();
    let status = 'upcoming';
    if (now >= election.startDate && now <= election.endDate) status = 'active';
    else if (now > election.endDate) status = 'finished';

    // Get candidates with their vote counts
    const candidates = await Candidate.find({ election: electionId }).lean();
    const voteCounts = await Vote.aggregate([
      { $match: { election: election._id } },
      { $group: { _id: '$candidate', count: { $sum: 1 } } }
    ]);
    const voteMap = {};
    voteCounts.forEach(v => { voteMap[v._id.toString()] = v.count; });

    const candidatesWithVotes = candidates.map(c => ({
      ...c,
      votes: voteMap[c._id.toString()] || 0
    }));

    // Leaderboard sorted by votes desc
    const leaderboard = [...candidatesWithVotes].sort((a, b) => b.votes - a.votes);

    // Winner if finished
    let winner = null;
    if (status === 'finished' && leaderboard.length > 0) {
      winner = leaderboard[0];
    }

    const hasVoted = await Vote.exists({ voter: userId, election: election._id });

    res.json({
      ...election,
      status,
      hasVoted: !!hasVoted,
      candidates: candidatesWithVotes,
      leaderboard,
      winner
    });
  } catch (err) {
    next(err);
  }
}

// @desc    Cast a vote after NID verification (replaces previous castVote)
// @route   POST /api/elections/:id/vote
// @access  Private
async function castVoteWithNid(req, res, next) {
  try {
    const electionId = req.params.id;
    const { candidateId, nid } = req.body;
    const userId = req.user.id;

    if (!candidateId || !nid) {
      return res.status(400).json({ message: 'Candidate ID and NID are required' });
    }

    // Verify NID matches the logged-in user
    const user = await User.findById(userId);
    if (!user || user.nid !== nid) {
      return res.status(400).json({ message: 'NID does not match your registered NID' });
    }

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    const now = new Date();
    if (now < election.startDate) {
      return res.status(400).json({ message: 'Election has not started yet' });
    }
    if (now > election.endDate) {
      return res.status(400).json({ message: 'Election has already ended' });
    }

    // Optional: check if user has joined the election (if you enforce joining)
    // if (!election.voters.includes(userId)) {
    //   return res.status(403).json({ message: 'You must join this election before voting' });
    // }

    // Check duplicate vote
    const existingVote = await Vote.findOne({ election: electionId, voter: userId });
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    // Verify candidate belongs to this election
    const candidate = await Candidate.findOne({ _id: candidateId, election: electionId });
    if (!candidate) {
      return res.status(400).json({ message: 'Invalid candidate for this election' });
    }

    // Create vote
    const vote = await Vote.create({
      election: electionId,
      candidate: candidateId,
      voter: userId,
      anonymousHash: user.anonymousHash,
      ipAddress: req.ip,
    });

    // Increment candidate vote count
    await Candidate.findByIdAndUpdate(candidateId, { $inc: { voteCount: 1 } });

    recordActivityLog({
      userId,
      eventType: 'vote',
      action: 'Cast vote',
      details: `Voted in ${election.title || 'an election'} for ${candidate.name}`,
      metadata: { electionId, candidateId },
      ipAddress: req.ip,
    }).catch(() => null);

    res.status(201).json({ message: 'Vote cast successfully', vote });
  } catch (err) {
    next(err);
  }
}

// Export all functions (replace old castVote with new one if desired, or keep both)
module.exports = {
  createElection,
  getElection,
  listAllElections,
  listActiveElections,
  listHistory,
  listCandidates,
  listManifestos,
  castVote: castVoteWithNid,      // override old castVote
  results,
  predictions,
  getJoinableElections,
  joinElection,
  getElectionStatus,
  getAllElections,                // new
  getElectionById,               // new
};