const express = require('express');
const multer = require('multer');
const { register, login } = require('../controllers/authController');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/register', upload.single('document'), register);
router.post('/login', login);

module.exports = router;
