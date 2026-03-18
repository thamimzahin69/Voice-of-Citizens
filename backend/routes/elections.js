const express = require('express');
const {
  createElection,
  getElection,
  listAllElections, // <-- ADDED THIS HERE
  listActiveElections,
  listHistory,
  listCandidates,
  listManifestos,
  castVote,
  results,
  predictions,
} = require('../controllers/electionsController');
const { requireAuth, requireAdmin } = require('../middleware/auth'); // Ensure this file exists!

const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/candidates' });

// Admin / General Election Routes
router.get('/', requireAuth, requireAdmin, listAllElections);
router.post('/', requireAuth, requireAdmin, upload.array('candidateImages'), createElection);

// Specific Election Category Routes
router.get('/active', requireAuth, listActiveElections);
router.get('/history', requireAuth, listHistory);
router.get('/predictions', requireAuth, predictions);

// Dynamic ID Routes (These must go below the specific routes like /active)
router.get('/:id', requireAuth, getElection);
router.get('/:id/candidates', requireAuth, listCandidates);
router.get('/:id/manifestos', requireAuth, listManifestos);
router.post('/:id/vote', requireAuth, castVote);
router.get('/:id/results', requireAuth, results);

module.exports = router;