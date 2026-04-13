const User = require('../models/User');
const Election = require('../models/Election');
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');

function parseCsvRows(fileContent) {
  const lines = fileContent.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  const header = lines[0].split(',').map((col) => col.trim().toLowerCase());
  const hasHeader = header.includes('name') && header.includes('email');
  const rows = hasHeader ? lines.slice(1) : lines;

  return rows.map((line) => {
    const values = line.split(',').map((value) => value.trim());
    if (hasHeader) {
      return header.reduce((acc, key, index) => {
        acc[key] = values[index] || '';
        return acc;
      }, {});
    }

    return {
      name: values[0] || '',
      email: values[1] || '',
      doc: values[2] || '',
      role: values[3] || '',
    };
  });
}

function generateTempPassword() {
  return `${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`;
}

async function bulkCreateUsers(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'CSV file is required' });
    }

    const defaultRole = (req.body.defaultRole || 'user').toLowerCase();
    if (!['admin', 'user'].includes(defaultRole)) {
      return res.status(400).json({ message: 'defaultRole must be either admin or user' });
    }

    const fileText = require('fs').readFileSync(req.file.path, 'utf8');
    const rows = parseCsvRows(fileText);

    if (!rows.length) {
      return res.status(400).json({ message: 'CSV file contains no rows' });
    }

    const createdUsers = [];
    const errors = [];

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const name = (row.name || '').trim();
      const email = (row.email || '').trim().toLowerCase();
      const role = (row.role || defaultRole || 'user').toLowerCase();
      const documentPath = row.doc ? row.doc.trim() : undefined;

      if (!name || !email) {
        errors.push({ row: rowIndex + 1, message: 'Name and email are required' });
        continue;
      }

      if (!['admin', 'user'].includes(role)) {
        errors.push({ row: rowIndex + 1, message: 'Role must be admin or user' });
        continue;
      }

      const tempPassword = generateTempPassword();
      const user = new User({
        name,
        email,
        role,
        documentPath,
        documentStatus: 'pending',
        forcePasswordReset: true,
      });
      user.password = tempPassword;

      try {
        await user.save();
        createdUsers.push({ email, role, tempPassword });
      } catch (saveError) {
        const message = saveError.code === 11000
          ? 'Duplicate email or NID conflict'
          : saveError.message;
        errors.push({ row: rowIndex + 1, message });
      }
    }

    res.json({
      message: 'Bulk user import completed',
      created: createdUsers,
      errors,
    });
  } catch (err) {
    next(err);
  }
}

function runBenfordAnalysis(values) {
  const expected = {
    1: 30.1,
    2: 17.6,
    3: 12.5,
    4: 9.7,
    5: 7.9,
    6: 6.7,
    7: 5.8,
    8: 5.1,
    
    9: 4.6,
  };

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  let sampleSize = 0;

  values.forEach((val) => {
    const num = Math.abs(Number(val));
    if (!Number.isFinite(num) || num <= 0) return;

    const digits = String(Math.trunc(num));
    const first = Number(digits[0]);
    if (first >= 1 && first <= 9) {
      counts[first] += 1;
      sampleSize += 1;
    }
  });

  const observed = {};
  const deviations = {};
  let mad = 0;

  for (let d = 1; d <= 9; d += 1) {
    const obs = sampleSize ? (counts[d] / sampleSize) * 100 : 0;
    observed[d] = Number(obs.toFixed(2));
    deviations[d] = Number((obs - expected[d]).toFixed(2));
    mad += Math.abs(obs - expected[d]);
  }

  mad = Number((mad / 9).toFixed(2));

  return {
    sampleSize,
    expected,
    observed,
    deviations,
    mad,
    signal: sampleSize >= 10 && mad > 6 ? 'possible-anomaly' : 'normal-range',
    note: sampleSize < 10 ? 'Low sample size for Benford reliability' : undefined,
  };
}

// Document Verification
async function listPendingVerifications(req, res, next) {
  try {
    const pendingUsers = await User.find({ documentStatus: 'pending' }).select('-passwordHash -anonymousHash').sort({ createdAt: -1 });
    res.json(pendingUsers);
  } catch (err) {
    next(err);
  }
}

async function verifyDocument(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      {
        documentStatus: 'verified',
        documentVerifiedAt: new Date(),
        documentVerifiedBy: req.user._id,
      },
      { new: true }
    ).select('-passwordHash -anonymousHash');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Document verified successfully', user });
  } catch (err) {
    next(err);
  }
}

async function rejectDocument(req, res, next) {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      {
        documentStatus: 'rejected',
        documentVerifiedAt: new Date(),
        documentVerifiedBy: req.user._id,
      },
      { new: true }
    ).select('-passwordHash -anonymousHash');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `Document rejected. Reason: ${reason}`, user });
  } catch (err) {
    next(err);
  }
}

// Demographics Analytics
async function getDemographicBreakdown(req, res, next) {
  try {
    const ageGroups = {
      '18-25': { count: 0, percent: 0 },
      '26-35': { count: 0, percent: 0 },
      '36-50': { count: 0, percent: 0 },
      '51-65': { count: 0, percent: 0 },
      '65+': { count: 0, percent: 0 },
    };

    const genderBreakdown = {
      male: { count: 0, percent: 0 },
      female: { count: 0, percent: 0 },
      other: { count: 0, percent: 0 },
    };

    const verifiedUsers = await User.find({ documentStatus: 'verified' });
    const totalUsers = verifiedUsers.length;

    verifiedUsers.forEach((user) => {
      // Age breakdown
      if (user.age) {
        if (user.age >= 18 && user.age <= 25) ageGroups['18-25'].count++;
        else if (user.age >= 26 && user.age <= 35) ageGroups['26-35'].count++;
        else if (user.age >= 36 && user.age <= 50) ageGroups['36-50'].count++;
        else if (user.age >= 51 && user.age <= 65) ageGroups['51-65'].count++;
        else if (user.age > 65) ageGroups['65+'].count++;
      }

      // Gender breakdown
      if (user.gender && genderBreakdown[user.gender]) {
        genderBreakdown[user.gender].count++;
      }
    });

    // Calculate percentages
    Object.keys(ageGroups).forEach((group) => {
      ageGroups[group].percent = totalUsers ? ((ageGroups[group].count / totalUsers) * 100).toFixed(2) : 0;
    });

    Object.keys(genderBreakdown).forEach((gender) => {
      genderBreakdown[gender].percent = totalUsers ? ((genderBreakdown[gender].count / totalUsers) * 100).toFixed(2) : 0;
    });

    res.json({
      totalVerifiedUsers: totalUsers,
      ageGroups,
      genderBreakdown,
    });
  } catch (err) {
    next(err);
  }
}

// Get demographics for a specific election
async function getElectionDemographics(req, res, next) {
  try {
    const { electionId } = req.params;

    const votes = await Vote.find({ election: electionId }).populate('voter', 'age gender');
    const voters = votes.map((v) => v.voter).filter((v) => v);

    const ageGroups = {
      '18-25': { count: 0, percent: 0 },
      '26-35': { count: 0, percent: 0 },
      '36-50': { count: 0, percent: 0 },
      '51-65': { count: 0, percent: 0 },
      '65+': { count: 0, percent: 0 },
    };

    const genderBreakdown = {
      male: { count: 0, percent: 0 },
      female: { count: 0, percent: 0 },
      other: { count: 0, percent: 0 },
    };

    voters.forEach((user) => {
      if (user.age) {
        if (user.age >= 18 && user.age <= 25) ageGroups['18-25'].count++;
        else if (user.age >= 26 && user.age <= 35) ageGroups['26-35'].count++;
        else if (user.age >= 36 && user.age <= 50) ageGroups['36-50'].count++;
        else if (user.age >= 51 && user.age <= 65) ageGroups['51-65'].count++;
        else if (user.age > 65) ageGroups['65+'].count++;
      }

      if (user.gender && genderBreakdown[user.gender]) {
        genderBreakdown[user.gender].count++;
      }
    });

    const totalVoters = voters.length;
    Object.keys(ageGroups).forEach((group) => {
      ageGroups[group].percent = totalVoters ? ((ageGroups[group].count / totalVoters) * 100).toFixed(2) : 0;
    });

    Object.keys(genderBreakdown).forEach((gender) => {
      genderBreakdown[gender].percent = totalVoters ? ((genderBreakdown[gender].count / totalVoters) * 100).toFixed(2) : 0;
    });

    res.json({
      electionId,
      totalVoters,
      ageGroups,
      genderBreakdown,
    });
  } catch (err) {
    next(err);
  }
}

// Area based voting comparison
async function getAreaVotingComparison(req, res, next) {
  try {
    const { electionId } = req.params;

    const votes = await Vote.find({ election: electionId })
      .populate('voter', 'locality')
      .populate('candidate', 'name voteCount');

    const areaStats = {};

    votes.forEach((vote) => {
      const locality = vote.voter?.locality || 'Unknown';
      if (!areaStats[locality]) {
        areaStats[locality] = {
          locality,
          totalVotes: 0,
          votesByCandidate: {},
        };
      }
      areaStats[locality].totalVotes++;

      const candidateName = vote.candidate?.name || 'Unknown';
      if (!areaStats[locality].votesByCandidate[candidateName]) {
        areaStats[locality].votesByCandidate[candidateName] = 0;
      }
      areaStats[locality].votesByCandidate[candidateName]++;
    });

    res.json(Object.values(areaStats));
  } catch (err) {
    next(err);
  }
}

// Suspicious outcome detection using standard deviation
async function detectSuspiciousOutcomes(req, res, next) {
  try {
    const { electionId } = req.params;

    const candidates = await Candidate.find({ election: electionId });
    // Calculate vote distribution
    const voteCounts = candidates.map((c) => c.voteCount || 0);
    const totalVotes = voteCounts.reduce((a, b) => a + b, 0);
    const benford = runBenfordAnalysis(voteCounts);

    if (totalVotes === 0) {
      return res.json({ message: 'No votes recorded yet', suspicious: false });
    }

    // Calculate mean
    const mean = totalVotes / candidates.length;

    // Calculate standard deviation
    const variance = voteCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / candidates.length;
    const stdDev = Math.sqrt(variance);

    // Identify suspicious patterns
    const suspicious = [];
    const threshold = mean + 2 * stdDev; // Beyond 2 standard deviations

    candidates.forEach((candidate) => {
      const voteCount = candidate.voteCount || 0;
      const zScore = stdDev > 0 ? (voteCount - mean) / stdDev : 0;

      if (voteCount > threshold || zScore > 2) {
        suspicious.push({
          candidate: candidate.name,
          votes: voteCount,
          zScore: zScore.toFixed(2),
          deviations: ((zScore * stdDev) / mean * 100).toFixed(2) + '%',
          alert: 'UNUSUAL_VOTE_DISTRIBUTION',
        });
      }
    });

    res.json({
      electionId,
      totalVotes,
      candidateCount: candidates.length,
      mean: mean.toFixed(2),
      standardDeviation: stdDev.toFixed(2),
      suspiciousCount: suspicious.length,
      suspiciousCandidates: suspicious,
      benford,
      isSuspicious: suspicious.length > 0 || benford.signal === 'possible-anomaly',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPendingVerifications,
  verifyDocument,
  rejectDocument,
  getDemographicBreakdown,
  getElectionDemographics,
  getAreaVotingComparison,
  detectSuspiciousOutcomes,
  bulkCreateUsers,
};
