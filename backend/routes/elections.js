const express = require('express');
const {
  createElection,
  listAllElections,
  listActiveElections,
  listHistory,
  listCandidates,
  listManifestos,
  castVote,
  results,
  predictions,
  getJoinableElections,
  joinElection,
  getElectionStatus,
  getAllElections,
  getElectionById,
  inviteUsersToElection,
} = require('../controllers/electionsController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/candidates' });

// ========== Election listing (authenticated) ==========
router.get('/', requireAuth, getAllElections);

// ========== Admin create election (require auth then admin) ==========
router.post('/', requireAuth, requireAdmin, upload.array('candidateImages'), createElection);  // FIXED

// ========== Admin invite users to election ==========
router.post('/:id/invite', requireAuth, requireAdmin, inviteUsersToElection);

// ========== Special category routes ==========
router.get('/active', listActiveElections);
router.get('/history', listHistory);
router.get('/predictions', requireAuth, predictions);

// ========== Joinable elections ==========
router.get('/joinable', requireAuth, getJoinableElections);
router.post('/:id/join', requireAuth, joinElection);

// ========== Dynamic ID routes ==========
router.get('/:id', requireAuth, getElectionById);
router.get('/:id/status', requireAuth, getElectionStatus);
router.get('/:id/candidates', requireAuth, listCandidates);
router.get('/:id/manifestos', requireAuth, listManifestos);
router.post('/:id/vote', requireAuth, castVote);
router.get('/:id/results', requireAuth, results);

module.exports = router;