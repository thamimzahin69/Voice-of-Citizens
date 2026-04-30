import { Link } from 'react-router-dom';

const features = [
  {
    slug: 'secure-voter-registration',
    icon: 'ID',
    title: 'Secure Voter Registration',
    description: 'Register with name, email, password, NID number, and uploaded NID document.',
  },
  {
    slug: 'digital-voting',
    icon: 'Vote',
    title: 'Digital Voting',
    description: 'Eligible voters can join active elections and cast votes securely.',
  },
  {
    slug: 'election-management',
    icon: 'Admin',
    title: 'Election Management',
    description: 'Admins can create elections, manage candidates, and configure timelines.',
  },
  {
    slug: 'complaint-system',
    icon: 'Help',
    title: 'Citizen Complaints',
    description: 'Users submit complaints while admins review, respond, and resolve them.',
  },
  {
    slug: 'voting-history',
    icon: 'Log',
    title: 'Voting History',
    description: 'Citizens can review their past election participation without exposing vote choice.',
  },
  {
    slug: 'admin-dashboard',
    icon: 'Ops',
    title: 'Admin Dashboard',
    description: 'Admins monitor registrations, users, logs, complaints, and election activity.',
  },
];

export default function FeatureSummary() {
  return (
    <section id="features" className="section">
      <div className="section-header">
        <p className="page-eyebrow">Platform Features</p>
        <h2>Everything citizens and administrators need to run trusted elections.</h2>
        <p>Clean workflows for registration, voting, oversight, complaints, and history.</p>
      </div>
      <div className="container feature-grid">
        {features.map((feature) => (
          <Link key={feature.slug} to={`/features/${feature.slug}`} className="feature-card">
            <span className="feature-icon">{feature.icon}</span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            <span className="link">Learn more</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
