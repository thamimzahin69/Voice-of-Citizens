const express = require('express');
const {
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
} = require('../controllers/electionsController');
const { requireAuth, requireAdmin } = require('../middleware/auth'); 

const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/candidates' });

// Admin / General Election Routes
// BOUNCER OFF: Let the dashboard read the elections
router.get('/', listAllElections); 

// BOUNCER OFF: Let the form create elections
router.post('/', upload.array('candidateImages'), createElection);

// Specific Election Category Routes
// BOUNCER OFF: Let the frontend read active and history lists
router.get('/active', listActiveElections);
router.get('/history', listHistory);
router.get('/predictions', requireAuth, predictions);

// Dynamic ID Routes (These must go below the specific routes like /active)
router.get('/:id', requireAuth, getElection);
router.get('/:id/candidates', requireAuth, listCandidates);
router.get('/:id/manifestos', requireAuth, listManifestos);
router.post('/:id/vote', requireAuth, castVote);
router.get('/:id/results', requireAuth, results);

module.exports = router;