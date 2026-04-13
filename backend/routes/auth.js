const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { register, login, completeProfile } = require('../controllers/authController');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/register', upload.single('document'), register);
router.post('/login', login);
router.post('/complete-profile', requireAuth, upload.single('document'), completeProfile);

module.exports = router;
