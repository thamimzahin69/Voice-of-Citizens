const express = require('express');
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  listPendingVerifications,
  verifyDocument,
  rejectDocument,
  getDemographicBreakdown,
  getElectionDemographics,
  getAreaVotingComparison,
  detectSuspiciousOutcomes,
  bulkCreateUsers,
  getAllUsers,
} = require('../controllers/adminController');

const upload = multer({ dest: 'uploads/csv' });
const router = express.Router();

// All admin routes require authentication and admin role
router.use(requireAuth, requireAdmin);

// Get all verified users for inviting to elections
router.get('/users', getAllUsers);

// Bulk user administration
router.post('/users/bulk', upload.single('file'), bulkCreateUsers);

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
