import { Link } from 'react-router-dom';

const faqs = [
  { question: 'How do I verify my identity?', answer: 'Upload your national ID and follow the guided steps in the registration flow.' },
  { question: 'Can I join multiple elections?', answer: 'Yes, you can join any active election once you are registered in the system.' },
  { question: 'How are results calculated?', answer: 'Results are calculated in real time based on verified votes and displayed in the election center.' },
];

export default function FAQSnippet() {
  return (
    <section className="section section-muted">
      <div className="section-header">
        <p className="page-eyebrow">FAQ</p>
        <h2>Frequently Asked Questions</h2>
      </div>
      <div className="container faq-grid">
        {faqs.map((faq) => (
          <article key={faq.question} className="faq-card">
            <h4>{faq.question}</h4>
            <p>{faq.answer}</p>
          </article>
        ))}
      </div>
      <div className="container" style={{ marginTop: '18px' }}>
        <Link to="/faq" className="btn btn-secondary">View all FAQs</Link>
      </div>
    </section>
  );
}
