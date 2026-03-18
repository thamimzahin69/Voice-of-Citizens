const express = require('express');
const { listComplaints, createComplaint } = require('../controllers/complaintsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, listComplaints);
router.post('/', requireAuth, createComplaint);

module.exports = router;
