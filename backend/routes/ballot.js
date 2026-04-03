const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  createBallot,
  autoAssignVotersToBallotsForElection,
  getBallotsForElection,
  getBallotDetails,
  getUserAssignedBallot,
  getBallotTurnout,
} = require('../controllers/ballotController');

const router = express.Router();

// Admin only routes
router.post('/', requireAuth, requireAdmin, createBallot);
router.post('/:electionId/auto-assign', requireAuth, requireAdmin, autoAssignVotersToBallotsForElection);
router.get('/:electionId/ballots', requireAuth, requireAdmin, getBallotsForElection);
router.get('/:ballotId/details', requireAuth, requireAdmin, getBallotDetails);
router.get('/:electionId/turnout', requireAuth, requireAdmin, getBallotTurnout);

// User routes (can see their assigned ballot)
router.get('/:electionId/my-ballot', requireAuth, getUserAssignedBallot);

module.exports = router;
