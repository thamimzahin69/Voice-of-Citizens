const Faq = require('../models/Faq');

async function listFaq(req, res, next) {
  try {
    const items = await Faq.find().sort({ createdAt: -1 });
    if (items.length === 0) {
      // Seed basic FAQs if none exist.
      const defaults = [
        { question: 'How do I register?', answer: 'Create an account using your email and verified NID.' },
        { question: 'Can I change my vote?', answer: 'Votes are final once cast to keep elections secure.' },
        { question: 'How are results published?', answer: 'Results are updated in real-time and stored for audit.' },
      ];
      const created = await Faq.insertMany(defaults);
      return res.json(created);
    }
    res.json(items);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listFaq,
};
