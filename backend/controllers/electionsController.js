// backend/controllers/electionsController.js

const path = require('path');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const User = require('../models/User');
const { recordActivityLog } = require('../services/activityLogService');
const { analyzeSuspiciousOutcomes } = require('./adminController');

function computeRankedElectionResults(candidateIds, ballots) {
  const active = new Set(candidateIds);
  const eliminatedRounds = {};
  const candidateRoundCounts = candidateIds.reduce((acc, id) => ({ ...acc, [id]: [] }), {});
  const rounds = [];
  let round = 1;

  while (true) {
    const tally = {};
    candidateIds.forEach((id) => {
      if (active.has(id)) tally[id] = 0;
    });

    let activeBallots = 0;
    ballots.forEach((ballot) => {
      const choice = ballot.find((pref) => active.has(pref));
      if (choice) {
        tally[choice] = (tally[choice] || 0) + 1;
        activeBallots += 1;
      }
    });

    candidateIds.forEach((id) => {
      candidateRoundCounts[id].push(active.has(id) ? tally[id] : null);
    });

    const roundData = {
      round,
      counts: { ...tally },
      eliminated: [],
      activeCandidates: Array.from(active),
      activeBallots,
    };

    if (activeBallots > 0) {
      for (const id of Object.keys(tally)) {
        if (tally[id] > activeBallots / 2) {
          const winnerId = id;
          candidateIds.forEach((cid) => {
            if (!eliminatedRounds[cid]) {
              eliminatedRounds[cid] = cid === winnerId ? round + 1 : round;
            }
          });
          rounds.push(roundData);
          return {
            candidateRoundCounts,
            eliminatedRounds,
            rounds,
            winnerId,
            totalRounds: round,
          };
        }
      }
    }

    const entries = Object.entries(tally).filter(([id]) => active.has(id));
    if (entries.length === 0) {
      rounds.push(roundData);
      return {
        candidateRoundCounts,
        eliminatedRounds,
        rounds,
        winnerId: null,
        totalRounds: round,
      };
    }

    let min = Infinity;
    entries.forEach(([, count]) => {
      if (count < min) min = count;
    });

    const toEliminate = entries.filter(([, count]) => count === min).map(([id]) => id);
    toEliminate.forEach((cid) => {
      active.delete(cid);
      eliminatedRounds[cid] = round;
    });
    roundData.eliminated = toEliminate;
    rounds.push(roundData);

    if (active.size === 1) {
      const winnerId = Array.from(active)[0];
      candidateIds.forEach((cid) => {
        if (!eliminatedRounds[cid]) eliminatedRounds[cid] = round + 1;
      });
      return {
        candidateRoundCounts,
        eliminatedRounds,
        rounds,
        winnerId,
        totalRounds: round,
      };
    }

    round += 1;
  }
}

async function buildElectionStatistics({ election, leaderboard, totalVotes, winner }) {
  const numericTotalVotes = Number(totalVotes) || 0;
  const invitedIds = Array.isArray(election.invitedUsers) ? election.invitedUsers : [];
  const eligibleVoterCount = invitedIds.length > 0
    ? new Set(invitedIds.map((id) => id.toString())).size
    : await User.countDocuments({ area: election.area, role: 'user', documentStatus: 'verified' });

  const candidates = (leaderboard || []).map((candidate, index) => {
    const voteCount = candidate.votes ?? candidate.finalVotes ?? 0;
    return {
      candidateId: candidate._id,
      candidateName: candidate.name,
      party: candidate.party || 'Independent',
      voteCount,
      sharePercent: numericTotalVotes ? Number(((voteCount / numericTotalVotes) * 100).toFixed(2)) : 0,
      rank: index + 1,
    };
  });

  const leader = winner || candidates[0] || null;

  return {
    totalVotes: numericTotalVotes,
    eligibleVoterCount: eligibleVoterCount || null,
    turnoutPercent: eligibleVoterCount ? Number(((numericTotalVotes / eligibleVoterCount) * 100).toFixed(2)) : null,
    candidates,
    leadingCandidate: leader ? {
      candidateId: leader._id || leader.candidateId,
      candidateName: leader.name || leader.candidateName,
      party: leader.party || 'Independent',
      voteCount: leader.votes ?? leader.finalVotes ?? leader.voteCount ?? 0,
    } : null,
  };
}

function userCanAccessElection(election, user) {
  if (!election) return false;
  if (election.mode === 'testing' && user.role !== 'admin') return false;
  return user.role === 'admin' || election.area === user.area || election.invitedUsers.includes(user._id);
}

// ==================== EXISTING FUNCTIONS (preserved) ====================

async function createElection(req, res, next) {
  try {
    const { mode = 'actual', type, title, description, startDate, endDate, votingType, area } = req.body;

    // Validate election mode
    if (!['actual', 'testing'].includes(mode)) {
      return res.status(422).json({ message: 'Invalid election mode. Must be "actual" or "testing"' });
    }

    // Validate voting type
    if (!votingType || !['majority', 'rankBased'].includes(votingType)) {
      return res.status(422).json({ message: 'Invalid votingType. Must be "majority" or "rankBased"' });
    }

    // Validate area
    if (!area || typeof area !== 'string' || area.trim().length === 0) {
      return res.status(422).json({ message: 'Area is required' });
    }

    const election = await Election.create({
      mode,
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

    // Regular users can see elections in their area or they are invited to, excluding testing mode
    const query = {
      mode: { $ne: 'testing' },
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
      endDate: { $gte: now },
      isPublished: true,
    };

    // Admin can see all active elections
    if (user.role !== 'admin') {
      // Regular users can only see elections in their area or they are invited to, excluding testing mode
      query.mode = { $ne: 'testing' };
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
    const query = { endDate: { $lt: now } };
    if (!req.user || req.user.role !== 'admin') {
      query.mode = { $ne: 'testing' };
    }

    const elections = await Election.find(query).sort({ endDate: -1 });
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

    if (!userCanAccessElection(election, user)) {
      return res.status(403).json({ message: 'You are not eligible to view this election' });
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

    if (!userCanAccessElection(election, user)) {
      return res.status(403).json({ message: 'You are not eligible to view this election' });
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

    if (!userCanAccessElection(election, user)) {
      return res.status(403).json({ message: 'You are not eligible to view this election' });
    }

    const candidates = await Candidate.find({ election: electionId }).lean();

    // Fetch raw votes for this election
    const votes = await Vote.find({ election: electionId }).lean();

    if (election.votingType === 'majority') {
      // Count single-choice votes
      const counts = {};
      candidates.forEach(c => { counts[c._id.toString()] = 0; });
      votes.forEach(v => {
        if (v.candidate) counts[v.candidate.toString()] = (counts[v.candidate.toString()] || 0) + 1;
      });

      const totalVotes = votes.filter(v => v.candidate).length;
      const results = candidates.map((c) => ({
        candidateId: c._id,
        candidateName: c.name,
        votes: counts[c._id.toString()] || 0,
        sharePercent: totalVotes ? ((counts[c._id.toString()] || 0) / totalVotes) * 100 : 0,
      }));

      return res.json(results);
    }

    // Rank-based (IRV) counting
    // Build ballots: prefer `ranked` array; fall back to single `candidate` if present
    const ballots = votes.map(v => {
      if (Array.isArray(v.ranked) && v.ranked.length > 0) return v.ranked.map(id => id.toString());
      if (v.candidate) return [v.candidate.toString()];
      return [];
    }).filter(b => b.length > 0);

    const candidateIds = candidates.map(c => c._id.toString());
    const irv = computeRankedElectionResults(candidateIds, ballots);

    const resultsData = candidates.map((c) => {
      const id = c._id.toString();
      const roundVotes = irv.candidateRoundCounts[id] || [];
      return {
        candidateId: c._id,
        candidateName: c.name,
        eliminatedRound: irv.eliminatedRounds[id] || null,
        finalVotes: roundVotes[roundVotes.length - 1] || 0,
        roundVotes,
      };
    });

    const leaderboard = [...resultsData].sort((a, b) => {
      const aSurvival = a.eliminatedRound || (irv.totalRounds + 1);
      const bSurvival = b.eliminatedRound || (irv.totalRounds + 1);
      if (aSurvival !== bSurvival) return bSurvival - aSurvival;
      return (b.finalVotes || 0) - (a.finalVotes || 0);
    });

    return res.json({
      results: resultsData,
      leaderboard,
      winnerId: irv.winnerId,
      rounds: irv.totalRounds,
      roundResults: irv.rounds,
    });
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
        mode: { $ne: 'testing' },
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
      // Regular users can only see elections in their area or they are invited to, excluding testing mode
      query.mode = { $ne: 'testing' };
      query.$or = [
        { area: user.area },
        { invitedUsers: user._id }
      ];
    }

    const elections = await Election.find(query).select('title description startDate endDate votingType area mode');

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
    if (!userCanAccessElection(election, user)) {
      return res.status(403).json({ msg: 'You are not eligible to join this election' });
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
    if (!userCanAccessElection(election, user)) {
      return res.status(403).json({ message: 'You are not eligible to view this election' });
    }

    const joined = election.voters?.includes(user._id) || false;
    const hasVoted = !!(await Vote.findOne({ election: electionId, voter: user._id }));

    res.json({ joined, hasVoted });
  } catch (err) {
    next(err);
  }
}

async function getElectionTamperingStatus(req, res, next) {
  try {
    const electionId = req.params.id;
    const user = req.user;

    const election = await Election.findById(electionId).lean();
    if (!election) return res.status(404).json({ message: 'Election not found' });

    if (!userCanAccessElection(election, user)) {
      return res.status(403).json({ message: 'You are not eligible to view this election' });
    }

    const analysis = await analyzeSuspiciousOutcomes(electionId);
    res.json({
      ...analysis,
      electionDisabled: election.isPublished === false,
      explanation: analysis.message || (
        analysis.isSuspicious
          ? 'Vote distribution exceeded the configured anomaly checks.'
          : 'Vote distribution is within the configured anomaly checks.'
      ),
    });
  } catch (err) {
    next(err);
  }
}

async function disableSuspiciousElection(req, res, next) {
  try {
    const electionId = req.params.id;
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    const analysis = await analyzeSuspiciousOutcomes(electionId);
    if (!analysis.isSuspicious) {
      return res.status(400).json({ message: 'Election is not marked suspicious and cannot be disabled from this action.' });
    }

    election.isPublished = false;
    await election.save();

    res.json({
      message: 'Election disabled because it was marked suspicious.',
      electionId,
      electionDisabled: true,
      tamperingStatus: analysis,
    });
  } catch (err) {
    next(err);
  }
}

function shuffleArray(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function getTestingAssignments(req, res, next) {
  try {
    const electionId = req.params.id;
    const election = await Election.findById(electionId).lean();
    if (!election) return res.status(404).json({ message: 'Election not found' });
    if (election.mode !== 'testing') {
      return res.status(400).json({ message: 'This endpoint is only available for testing elections' });
    }

    const voters = await User.find({
      area: election.area,
      documentStatus: 'verified',
      role: 'user',
    }).select('name email locality area anonymousHash').lean();

    const candidateList = await Candidate.find({ election: electionId }).lean();
    const voteDocs = await Vote.find({ election: electionId, voter: { $in: voters.map((v) => v._id) } }).lean();
    const voteMap = voteDocs.reduce((acc, vote) => {
      acc[vote.voter.toString()] = vote;
      return acc;
    }, {});

    const votersWithAssignments = voters.map((voter) => {
      const vote = voteMap[voter._id.toString()];
      let voteDetails = null;
      if (vote) {
        if (vote.candidate) {
          const candidate = candidateList.find((c) => c._id.toString() === vote.candidate.toString());
          voteDetails = {
            type: 'majority',
            candidateId: vote.candidate,
            candidateName: candidate?.name || 'Unknown candidate',
          };
        } else if (Array.isArray(vote.ranked)) {
          voteDetails = {
            type: 'rankBased',
            ranked: vote.ranked.map((id) => {
              const candidate = candidateList.find((c) => c._id.toString() === id.toString());
              return {
                candidateId: id,
                candidateName: candidate?.name || 'Unknown candidate',
              };
            }),
          };
        }
      }

      return {
        _id: voter._id,
        name: voter.name,
        email: voter.email,
        locality: voter.locality || 'Unknown',
        area: voter.area,
        hasVoted: Boolean(vote),
        voteDetails,
      };
    });

    res.json({
      election: {
        _id: election._id,
        title: election.title,
        area: election.area,
        votingType: election.votingType,
        startDate: election.startDate,
        endDate: election.endDate,
        mode: election.mode,
      },
      candidates: candidateList.map((c) => ({ _id: c._id, name: c.name, party: c.party || 'Independent' })),
      voters: votersWithAssignments,
      voterCount: votersWithAssignments.length,
    });
  } catch (err) {
    next(err);
  }
}

async function generateTestVotes(req, res, next) {
  try {
    const electionId = req.params.id;
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    if (election.mode !== 'testing') {
      return res.status(400).json({ message: 'This endpoint is only available for testing elections' });
    }

    const voters = await User.find({
      area: election.area,
      documentStatus: 'verified',
      role: 'user',
    }).select('name email locality area anonymousHash').lean();

    if (voters.length === 0) {
      return res.json({ message: 'No verified users assigned to this election area', generatedVotes: 0 });
    }

    const candidates = await Candidate.find({ election: electionId }).lean();
    if (candidates.length === 0) {
      return res.status(400).json({ message: 'No candidates are configured for this election' });
    }

    const voterIds = voters.map((voter) => voter._id);
    await Vote.deleteMany({ election: electionId, voter: { $in: voterIds } });

    const votesToInsert = voters.map((voter) => {
      if (election.votingType === 'majority') {
        const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
        return {
          election: electionId,
          candidate: randomCandidate._id,
          voter: voter._id,
          anonymousHash: voter.anonymousHash,
          ipAddress: req.ip,
        };
      }

      const rankedCandidateIds = shuffleArray(candidates.map((c) => c._id));
      return {
        election: electionId,
        ranked: rankedCandidateIds,
        voter: voter._id,
        anonymousHash: voter.anonymousHash,
        ipAddress: req.ip,
      };
    });

    await Vote.insertMany(votesToInsert, { ordered: false });

    if (election.votingType === 'majority') {
      await Candidate.updateMany({ election: electionId }, { $set: { voteCount: 0 } });
      const tally = {};
      votesToInsert.forEach((vote) => {
        const candidateId = vote.candidate.toString();
        tally[candidateId] = (tally[candidateId] || 0) + 1;
      });
      await Promise.all(Object.entries(tally).map(([candidateId, count]) =>
        Candidate.findByIdAndUpdate(candidateId, { $inc: { voteCount: count } })
      ));
    }

    res.json({
      message: 'Generated random test votes for assigned users',
      generatedVotes: votesToInsert.length,
      voterCount: voters.length,
    });
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
      // Regular users can only see elections in their area or they are invited to, excluding testing mode
      query = {
        mode: { $ne: 'testing' },
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
      if (election.isPublished === false) status = 'disabled';
      else if (now >= election.startDate && now <= election.endDate) status = 'active';
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
    if (!userCanAccessElection(election, user)) {
      return res.status(403).json({ message: 'You are not eligible to view this election' });
    }

    const now = new Date();
    let status = 'upcoming';
    if (election.isPublished === false) status = 'disabled';
    else if (now >= election.startDate && now <= election.endDate) status = 'active';
    else if (now > election.endDate) status = 'finished';

    // Get candidates
    const candidates = await Candidate.find({ election: electionId }).lean();

    // Prepare response containers
    let candidatesWithVotes = [];
    let leaderboard = [];
    let winner = null;
    let totalVotes = 0;

    if (election.votingType === 'majority') {
      // Count single-choice votes
      const voteCounts = await Vote.aggregate([
        { $match: { election: election._id, candidate: { $exists: true, $ne: null } } },
        { $group: { _id: '$candidate', count: { $sum: 1 } } }
      ]);
      const voteMap = {};
      voteCounts.forEach(v => { if (v._id) voteMap[v._id.toString()] = v.count; });

      candidatesWithVotes = candidates.map(c => ({
        ...c,
        votes: voteMap[c._1?.toString?.() ?? c._id.toString()] || voteMap[c._id.toString()] || 0
      }));

      leaderboard = [...candidatesWithVotes].sort((a, b) => (b.votes || 0) - (a.votes || 0));
      if (status === 'finished' && leaderboard.length > 0) winner = leaderboard[0];
      totalVotes = candidatesWithVotes.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);
    } else {
      // Rank-based (IRV)
      const votes = await Vote.find({ election: election._id }).lean();
      const ballots = votes.map(v => {
        if (Array.isArray(v.ranked) && v.ranked.length > 0) return v.ranked.map(id => id.toString());
        if (v.candidate) return [v.candidate.toString()];
        return [];
      }).filter(b => b.length > 0);

      const candidateIds = candidates.map(c => c._id.toString());
      const irv = computeRankedElectionResults(candidateIds, ballots);

      candidatesWithVotes = candidates.map((c) => {
        const id = c._id.toString();
        const roundVotes = irv.candidateRoundCounts[id] || [];
        return {
          ...c,
          eliminatedRound: irv.eliminatedRounds[id] || null,
          roundVotes,
          votes: roundVotes[roundVotes.length - 1] || 0,
        };
      });

      leaderboard = [...candidatesWithVotes].sort((a, b) => {
        const aSurvival = a.eliminatedRound || (irv.totalRounds + 1);
        const bSurvival = b.eliminatedRound || (irv.totalRounds + 1);
        if (aSurvival !== bSurvival) return bSurvival - aSurvival;
        return (b.votes || 0) - (a.votes || 0);
      });

      if (status === 'finished' && leaderboard.length > 0) winner = leaderboard[0];
      election.rounds = irv.totalRounds;
      election.roundResults = irv.rounds;
      totalVotes = ballots.length;
    }

    const hasVoted = await Vote.exists({ voter: userId, election: election._id });
    const statistics = await buildElectionStatistics({
      election,
      leaderboard,
      totalVotes,
      winner: winner || leaderboard[0],
    });

    res.json({
      ...election,
      status,
      hasVoted: !!hasVoted,
      candidates: candidatesWithVotes,
      leaderboard,
      winner,
      statistics,
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
    const { candidateId, ranked, nid } = req.body;
    const userId = req.user.id;

    if (!nid) return res.status(400).json({ message: 'NID is required' });

    // Verify NID matches the logged-in user
    const user = await User.findById(userId);
    if (!user || user.nid !== nid) {
      return res.status(400).json({ message: 'NID does not match your registered NID' });
    }

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    if (election.isPublished === false) {
      return res.status(400).json({ message: 'This election is disabled and no longer accepts votes' });
    }

    // Check if user is allowed to vote in this election
    if (!userCanAccessElection(election, req.user)) {
      return res.status(403).json({ message: 'You are not eligible to vote in this election' });
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
    if (existingVote) return res.status(400).json({ message: 'You have already voted in this election' });

    if (election.votingType === 'majority') {
      // Majority voting expects a single candidateId
      if (!candidateId) return res.status(400).json({ message: 'Candidate ID is required for majority voting' });
      const candidate = await Candidate.findOne({ _id: candidateId, election: electionId });
      if (!candidate) return res.status(400).json({ message: 'Invalid candidate for this election' });

      const vote = await Vote.create({
        election: electionId,
        candidate: candidateId,
        voter: userId,
        anonymousHash: user.anonymousHash,
        ipAddress: req.ip,
      });

      // Maintain legacy voteCount field for quick lookups
      await Candidate.findByIdAndUpdate(candidateId, { $inc: { voteCount: 1 } });

      recordActivityLog({
        userId,
        eventType: 'vote',
        action: 'Cast vote',
        details: `Voted in ${election.title || 'an election'} for ${candidate.name}`,
        metadata: { electionId, candidateId },
        ipAddress: req.ip,
      }).catch(() => null);

      return res.status(201).json({ message: 'Vote cast successfully', vote });
    }

    // Rank-based voting (IRV) expects a `ranked` array of candidate IDs
    if (election.votingType === 'rankBased') {
      if (!Array.isArray(ranked) || ranked.length === 0) return res.status(400).json({ message: 'Ranked preferences are required for rank-based voting' });

      // Validate ranked candidate IDs belong to this election
      const validIds = await Candidate.find({ election: electionId }).select('_id').lean();
      const validSet = new Set(validIds.map(v => v._id.toString()));
      const cleaned = ranked.map(id => id.toString()).filter(id => validSet.has(id));
      if (cleaned.length === 0) return res.status(400).json({ message: 'No valid ranked candidates provided' });
      const uniqueRanked = Array.from(new Set(cleaned));
      if (uniqueRanked.length !== cleaned.length) {
        return res.status(400).json({ message: 'Each candidate may only appear once in ranked preferences' });
      }

      const vote = await Vote.create({
        election: electionId,
        ranked: uniqueRanked,
        voter: userId,
        anonymousHash: user.anonymousHash,
        ipAddress: req.ip,
      });

      recordActivityLog({
        userId,
        eventType: 'vote',
        action: 'Cast ranked vote',
        details: `Cast ranked vote in ${election.title || 'an election'}`,
        metadata: { electionId, ranked: cleaned },
        ipAddress: req.ip,
      }).catch(() => null);

      return res.status(201).json({ message: 'Ranked vote cast successfully', vote });
    }

    return res.status(400).json({ message: 'Unsupported voting type' });
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
  getElectionTamperingStatus,
  disableSuspiciousElection,
  getTestingAssignments,
  generateTestVotes,
  getAllElections,                // new
  getElectionById,               // new
  inviteUsersToElection,         // new
};
