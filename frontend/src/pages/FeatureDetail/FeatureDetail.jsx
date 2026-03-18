import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';

const featureDetails = {
  'secure-voting': {
    title: 'Secure Voting Workflows',
    description:
      'Create elections, prepare voter rolls, and secure each vote with tokenized voting sessions. Administrators can define roles, manage election windows, and audit vote histories.',
    highlights: [
      'Role-based access (Admin / Voter)',
      'Secure token-based voting links',
      'Audit trail for every vote',
    ],
  },
  'real-time-results': {
    title: 'Real-time Results Dashboard',
    description:
      'See live updates as votes are tallied. Filter results by region, party, or candidate, and export reports for compliance and analysis.',
    highlights: ['Live vote tally updates', 'Historical turnout charts', 'Export to CSV / PDF'],
  },
  complaints: {
    title: 'Complaint Tracking & Resolution',
    description:
      'Citizens can submit complaints about elections; admins can triage, comment, and resolve them while keeping stakeholders informed.',
    highlights: ['Complaint statuses', 'Admin comment threads', 'Export history logs'],
  },
};

export default function FeatureDetail() {
  const { slug } = useParams();
  const feature = useMemo(() => featureDetails[slug] ?? null, [slug]);

  if (!feature) {
    return (
      <main className="page">
        <h1>Feature not found</h1>
        <p>We couldn’t find a feature with that identifier.</p>
        <Link to="/">Return to Home</Link>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>{feature.title}</h1>
        <p>{feature.description}</p>
      </header>
      <section className="feature-highlights">
        <h2>Highlights</h2>
        <ul>
          {feature.highlights.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>
      <div className="page-actions">
        <Link to="/auth/sign-up" className="btn">
          Get Started
        </Link>
      </div>
    </main>
  );
}
