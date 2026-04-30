const express = require('express');
const {
	listFaq,
	createFaq,
	updateFaq,
	deleteFaq,
} = require('../controllers/faqController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, listFaq);
router.post('/', requireAuth, requireAdmin, createFaq);
router.put('/:id', requireAuth, requireAdmin, updateFaq);
router.delete('/:id', requireAuth, requireAdmin, deleteFaq);

module.exports = router;
