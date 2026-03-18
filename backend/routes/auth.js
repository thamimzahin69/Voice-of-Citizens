const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const { register, login } = require('../controllers/authController');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post(
  '/register',
  upload.single('document'),
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('nid').trim().notEmpty(),
  register,
);

router.post('/login', login);

module.exports = router;
