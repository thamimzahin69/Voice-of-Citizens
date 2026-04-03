const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  listPendingVerifications,
  verifyDocument,
  rejectDocument,
  getDemographicBreakdown,
  getElectionDemographics,
  getAreaVotingComparison,
  detectSuspiciousOutcomes,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(requireAuth, requireAdmin);

// Document Verification Routes
router.get('/documents/pending', listPendingVerifications);
router.post('/documents/:userId/verify', verifyDocument);
router.post('/documents/:userId/reject', rejectDocument);

// Demographics Routes
router.get('/demographics/breakdown', getDemographicBreakdown);
router.get('/elections/:electionId/demographics', getElectionDemographics);

// Area Voting Comparison Routes
router.get('/elections/:electionId/area-comparison', getAreaVotingComparison);

// Suspicious Outcome Detection Routes
router.get('/elections/:electionId/detect-suspicious', detectSuspiciousOutcomes);

module.exports = router;
