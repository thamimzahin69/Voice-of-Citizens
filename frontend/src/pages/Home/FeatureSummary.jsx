import { Link } from 'react-router-dom';

const features = [
  {
    slug: 'secure-voting',
    title: 'Secure Voting Workflows',
    description: 'Create elections, register voters, and conduct secure voting with role-based access.',
  },
  {
    slug: 'real-time-results',
    title: 'Real-time Results',
    description: 'View live vote tallies, historical turnout, and predicted outcomes.',
  },
  {
    slug: 'complaints',
    title: 'Citizen Complaints',
    description: 'Track and manage complaints, and resolve issues with audit trails.',
  },
];

export default function FeatureSummary() {
  return (
    <section id="features" className="feature-summary">
      <h2>Key Features</h2>
      <div className="feature-grid">
        {features.map((feature) => (
          <article key={feature.slug} className="feature-card">
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            <Link to={`/features/${feature.slug}`} className="link">
              Learn more
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
