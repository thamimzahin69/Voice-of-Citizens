const express = require('express');
const multer = require('multer');
const { listComplaints, createComplaint } = require('../controllers/complaintsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: 'uploads/complaints' });

router.get('/', requireAuth, listComplaints);
router.post('/', requireAuth, upload.single('attachment'), createComplaint);

module.exports = router;
