const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');

async function createElection(req, res, next) {
  try {
    const { title, description, startDate, endDate } = req.body;
    const election = await Election.create({
      title,
      description,
      startDate,
      endDate,
      createdBy: req.user._id,
    });
    res.status(201).json(election);
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

async function castVote(req, res, next) {
  try {
    const { electionId } = req.params;
    const { candidateId } = req.body;
    const voterId = req.user._id;

    // Prevent double voting
    const already = await Vote.findOne({ election: electionId, voter: voterId });
    if (already) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    const vote = await Vote.create({
      election: electionId,
      candidate: candidateId,
      voter: voterId,
      ipAddress: req.ip,
    });

    await Candidate.findByIdAndUpdate(candidateId, { $inc: { voteCount: 1 } });

    res.status(201).json(vote);
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
    // Simple prediction based on current vote share
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

module.exports = {
  createElection,
  getElection,
  listActiveElections,
  listHistory,
  listCandidates,
  listManifestos,
  castVote,
  results,
  predictions,
};
