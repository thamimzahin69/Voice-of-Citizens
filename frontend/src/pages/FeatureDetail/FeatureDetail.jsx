import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';

const featureDetails = {
  overview: {
    title: 'Platform Features',
    description: 'Voice of Citizens combines voter registration, election operations, voting, complaints, and history in one clean civic dashboard.',
    highlights: ['Secure voter registration', 'Digital voting workflows', 'Admin oversight tools'],
  },
  'secure-voter-registration': {
    title: 'Secure Voter Registration',
    description: 'Citizens register with their basic identity details, NID number, and uploaded NID document for administrator review.',
    highlights: ['NID document upload', 'Pending approval workflow', 'Role-based account access'],
  },
  'digital-voting': {
    title: 'Digital Voting',
    description: 'Eligible voters can join active elections, review candidate details, and cast a secure vote during the election window.',
    highlights: ['Active election cards', 'Candidate review', 'Vote status tracking'],
  },
  'election-management': {
    title: 'Election Management',
    description: 'Administrators can create elections, configure timelines, add candidates, and monitor participation.',
    highlights: ['Election creation form', 'Candidate information', 'Timeline configuration'],
  },
  'complaint-system': {
    title: 'Complaint System',
    description: 'Citizens can submit election-related issues while administrators review, triage, and respond.',
    highlights: ['Complaint submission', 'Status badges', 'Admin review view'],
  },
  'voting-history': {
    title: 'Voting History',
    description: 'Users can see which elections they joined and whether they voted, without exposing private ballot choices.',
    highlights: ['Participation history', 'Privacy-conscious status', 'Admin summaries'],
  },
  'admin-dashboard': {
    title: 'Admin Dashboard',
    description: 'A role-aware dashboard for reviewing registrations, bulk importing users, monitoring logs, and managing complaints.',
    highlights: ['Registration review', 'Bulk user import', 'System activity overview'],
  },
};

export default function FeatureDetail() {
  const { slug } = useParams();
  const feature = useMemo(() => featureDetails[slug] ?? null, [slug]);

  if (!feature) {
    return (
      <main className="page narrow-page">
        <h1>Feature not found</h1>
        <p>We could not find a feature with that identifier.</p>
        <Link to="/" className="btn btn-secondary">Return Home</Link>
      </main>
    );
  }

  return (
    <main className="page narrow-page">
      <header className="page-header">
        <p className="page-eyebrow">Feature detail</p>
        <h1>{feature.title}</h1>
        <p>{feature.description}</p>
      </header>
      <section className="card">
        <h2>Highlights</h2>
        <div className="grid">
          {feature.highlights.map((point) => (
            <div key={point} className="mini-stat">
              <span>{point}</span>
              <strong>Ready</strong>
            </div>
          ))}
        </div>
      </section>
      <div className="page-actions" style={{ marginTop: '18px' }}>
        <Link to="/auth/sign-up" className="btn">Get Started</Link>
        <Link to="/" className="btn btn-secondary">Back to Home</Link>
      </div>
    </main>
  );
}
