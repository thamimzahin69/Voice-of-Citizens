import { Link } from 'react-router-dom';

const faqs = [
  { question: 'How do I verify my identity?', answer: 'Upload your national ID and follow the guided steps in the registration flow.' },
  { question: 'Can I join multiple elections?', answer: 'Yes, you can join any active election once you are registered in the system.' },
  { question: 'How are results calculated?', answer: 'Results are calculated in real time based on verified votes and displayed in the election center.' },
];

export default function FAQSnippet() {
  return (
    <section className="faq-snippet">
      <h2>Frequently Asked Questions</h2>
      <div className="faq-grid">
        {faqs.map((faq) => (
          <article key={faq.question} className="faq-card">
            <h4>{faq.question}</h4>
            <p>{faq.answer}</p>
          </article>
        ))}
      </div>
      <Link to="/faq" className="link">
        View all FAQs
      </Link>
    </section>
  );
}
