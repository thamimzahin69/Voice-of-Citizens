const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');

async function createElection(req, res, next) {
  try {
    const { type, title, description, startDate, endDate } = req.body;

    const election = await Election.create({
      type,
      title,
      description,
      startDate,
      endDate,
      // createdBy: req.user._id,
      createdBy: "65f0a1b2c3d4e5f6a7b8c9d0",
    });

    // Expect candidates to be sent as JSON with optional image files in `candidateImages`
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

async function castVote(req, res, next) {
  try {
    const { electionId } = req.params;
    const { candidateId } = req.body;
    const voterId = req.user._id;

    // Get the voter's anonymous hash
    const voter = await require('../models/User').findById(voterId);
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    // Prevent double voting
    const already = await Vote.findOne({ election: electionId, voter: voterId });
    if (already) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    const vote = await Vote.create({
      election: electionId,
      candidate: candidateId,
      voter: voterId,
      anonymousHash: voter.anonymousHash, // Store anonymous hash for vote tracking
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
  listAllElections,
  listActiveElections,
  listHistory,
  listCandidates,
  listManifestos,
  castVote,
  results,
  predictions,
};
