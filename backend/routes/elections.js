const express = require('express');
const {
  createElection,
  getElection,
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

router.get('/active', requireAuth, listActiveElections);
router.get('/history', requireAuth, listHistory);
router.get('/predictions', requireAuth, predictions);

router.post('/', requireAuth, requireAdmin, createElection);
router.get('/:id', requireAuth, getElection);
router.get('/:id/candidates', requireAuth, listCandidates);
router.get('/:id/manifestos', requireAuth, listManifestos);
router.post('/:id/vote', requireAuth, castVote);
router.get('/:id/results', requireAuth, results);

module.exports = router;
