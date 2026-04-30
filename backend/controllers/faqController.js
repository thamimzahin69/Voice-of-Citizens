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

async function createFaq(req, res, next) {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(422).json({ message: 'Question and answer are required' });
    }

    const faq = await Faq.create({ question, answer });
    res.status(201).json(faq);
  } catch (err) {
    next(err);
  }
}

async function updateFaq(req, res, next) {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(422).json({ message: 'Question and answer are required' });
    }

    const faq = await Faq.findByIdAndUpdate(
      req.params.id,
      { question, answer },
      { new: true, runValidators: true }
    );

    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    res.json(faq);
  } catch (err) {
    next(err);
  }
}

async function deleteFaq(req, res, next) {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id);

    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    res.json({ message: 'FAQ deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listFaq,
  createFaq,
  updateFaq,
  deleteFaq,
};
