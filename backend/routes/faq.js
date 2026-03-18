const express = require('express');
const { listFaq } = require('../controllers/faqController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, listFaq);

module.exports = router;
