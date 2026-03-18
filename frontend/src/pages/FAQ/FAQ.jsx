import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get('/faq');
        setFaqs(data);
      } catch {
        setFaqs([
          { question: 'How do I register?', answer: 'Create an account using your email and verified NID.' },
          { question: 'Can I change my vote?', answer: 'Votes are final once cast to keep elections secure.' },
        ]);
      }
    }
    load();
  }, []);

  return (
    <main className="page">
      <header className="page-header">
        <h1>Frequently Asked Questions</h1>
        <p>Need help? Browse common questions about voting and administration.</p>
      </header>
      <div className="faq-list">
        {faqs.map((faq) => (
          <article key={faq.question} className="faq-card">
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
