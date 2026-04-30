// backend/controllers/electionsController.js

const path = require('path');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const User = require('../models/User');
const { recordActivityLog } = require('../services/activityLogService');

// ==================== EXISTING FUNCTIONS (preserved) ====================

async function createElection(req, res, next) {
  try {
    const { type, title, description, startDate, endDate, votingType, area } = req.body;

    // Validate voting type
    if (!votingType || !['majority', 'rankBased'].includes(votingType)) {
      return res.status(422).json({ message: 'Invalid votingType. Must be "majority" or "rankBased"' });
    }

    // Validate area
    if (!area || typeof area !== 'string' || area.trim().length === 0) {
      return res.status(422).json({ message: 'Area is required' });
    }

    const election = await Election.create({
      type,
      title,
      description,
      votingType,
      area: area.trim(),
      startDate,
      endDate,
      createdBy: req.user._id,
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
        candidate.imagePath = file.filename;
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
    const user = req.user;
    
    // Admin can see all elections
    if (user.role === 'admin') {
      const elections = await Election.find().sort({ createdAt: -1 });
      return res.json(elections);
    }

    // Regular users can see elections in their area or they are invited to
    const query = {
      $or: [
        { area: user.area },
        { invitedUsers: user._id }
      ]
    };
    
    const elections = await Election.find(query).sort({ createdAt: -1 });
    res.json(elections);
  } catch (err) {
    next(err);
  }
}

async function listActiveElections(req, res, next) {
  try {
    const user = req.user;
    const now = new Date();
    
    let query = {
      startDate: { $lte: now },
      endDate: { $gte: now }
    };

    // Admin can see all active elections
    if (user.role !== 'admin') {
      // Regular users can only see elections in their area or they are invited to
      query.$or = [
        { area: user.area },
        { invitedUsers: user._id }
      ];
    }

    const elections = await Election.find(query).sort({ startDate: -1 });
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
    const electionId = req.params.id;
    const user = req.user;

    // Check if user can access this election
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    if (user.role !== 'admin') {
      const canAccess = election.area === user.area || election.invitedUsers.includes(user._id);
      if (!canAccess) {
        return res.status(403).json({ message: 'You are not eligible to view this election' });
      }
    }

    const candidates = await Candidate.find({ election: electionId }).select(
      'name party manifesto voteCount imagePath createdAt'
    );

    // Enhance candidate data with full profile information
    const enhancedCandidates = candidates.map(candidate => {
      const imageFileName = candidate.imagePath ? path.basename(candidate.imagePath) : null;
      return {
        _id: candidate._id,
        name: candidate.name,
        party: candidate.party || 'Independent',
        manifesto: candidate.manifesto,
        voteCount: candidate.voteCount,
        imagePath: candidate.imagePath,
        imageUrl: imageFileName ? `${req.protocol}://${req.get('host')}/uploads/candidates/${imageFileName}` : null,
        joinedDate: candidate.createdAt,
        electionId: electionId,
        electionTitle: election.title,
      };
    });

    res.json(enhancedCandidates);
  } catch (err) {
    next(err);
  }
}

async function listManifestos(req, res, next) {
  try {
    const electionId = req.params.id;
    const user = req.user;

    // Check if user can access this election
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    if (user.role !== 'admin') {
      const canAccess = election.area === user.area || election.invitedUsers.includes(user._id);
      if (!canAccess) {
        return res.status(403).json({ message: 'You are not eligible to view this election' });
      }
    }

    const candidates = await Candidate.find({ election: electionId });
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
    const electionId = req.params.id;
    const user = req.user;

    // Check if user can access this election
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    if (user.role !== 'admin') {
      const canAccess = election.area === user.area || election.invitedUsers.includes(user._id);
      if (!canAccess) {
        return res.status(403).json({ message: 'You are not eligible to view this election' });
      }
    }

    const candidates = await Candidate.find({ election: electionId });
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
    const user = req.user;

    // Get all elections user can access
    let elections;
    if (user.role === 'admin') {
      elections = await Election.find();
    } else {
      elections = await Election.find({
        $or: [
          { area: user.area },
          { invitedUsers: user._id }
        ]
      });
    }

    const electionIds = elections.map(e => e._id.toString());

    const candidates = await Candidate.find({ election: { $in: electionIds } });
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
    const user = req.user;
    const now = new Date();

    let query = {
      endDate: { $gt: now },
      isPublished: true,
    };

    // Admin can see all joinable elections
    if (user.role !== 'admin') {
      // Regular users can only see elections in their area or they are invited to
      query.$or = [
        { area: user.area },
        { invitedUsers: user._id }
      ];
    }

    const elections = await Election.find(query).select('title description startDate endDate votingType area');

    const votes = await Vote.find({ voter: user._id }).distinct('election');

    const enriched = elections.map(election => ({
      ...election.toObject(),
      joined: election.voters?.includes(user._id) || false,
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
    const user = req.user;
    const userId = user.id;

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ msg: 'Election not found' });

    // Check if user is allowed to join this election
    if (user.role !== 'admin') {
      const canAccess = election.area === user.area || election.invitedUsers.includes(user._id);
      if (!canAccess) {
        return res.status(403).json({ msg: 'You are not eligible to join this election' });
      }
    }

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
    const user = req.user;

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ msg: 'Election not found' });

    // Check if user can access this election
    if (user.role !== 'admin') {
      const canAccess = election.area === user.area || election.invitedUsers.includes(user._id);
      if (!canAccess) {
        return res.status(403).json({ message: 'You are not eligible to view this election' });
      }
    }

    const joined = election.voters?.includes(user._id) || false;
    const hasVoted = !!(await Vote.findOne({ election: electionId, voter: user._id }));

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
    const user = req.user;
    const userId = user.id;

    let query = {};

    // Admin can see all elections
    if (user.role !== 'admin') {
      // Regular users can only see elections in their area or they are invited to
      query = {
        $or: [
          { area: user.area },
          { invitedUsers: user._id }
        ]
      };
    }

    const elections = await Election.find(query).select('-__v').lean();

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
    const user = req.user;
    const userId = user.id;

    const election = await Election.findById(electionId).lean();
    if (!election) return res.status(404).json({ message: 'Election not found' });

    // Check if user is allowed to view this election
    if (user.role !== 'admin') {
      const canAccess = election.area === user.area || election.invitedUsers.includes(user._id);
      if (!canAccess) {
        return res.status(403).json({ message: 'You are not eligible to view this election' });
      }
    }

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

    // Check if user is allowed to vote in this election
    if (req.user.role !== 'admin') {
      const canAccess = election.area === req.user.area || election.invitedUsers.includes(req.user._id);
      if (!canAccess) {
        return res.status(403).json({ message: 'You are not eligible to vote in this election' });
      }
    }

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

// @desc    Invite users to an election (Admin only)
// @route   POST /api/elections/:id/invite
// @access  Private/Admin
async function inviteUsersToElection(req, res, next) {
  try {
    const { electionId } = req.params;
    const { userIds } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can invite users to elections' });
    }

    // Validate request
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(422).json({ message: 'userIds must be a non-empty array' });
    }

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Add users to invitedUsers array (avoiding duplicates)
    const newInvites = userIds.filter(userId => !election.invitedUsers.includes(userId));
    
    if (newInvites.length > 0) {
      election.invitedUsers.push(...newInvites);
      await election.save();
    }

    res.json({
      message: `${newInvites.length} user(s) invited successfully`,
      invitedCount: newInvites.length,
      election
    });
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
  inviteUsersToElection,         // new
};