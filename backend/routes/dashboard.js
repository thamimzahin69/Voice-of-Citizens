const express = require('express');
const { overview } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', requireAuth, overview);

module.exports = router;
