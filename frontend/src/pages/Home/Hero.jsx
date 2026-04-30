import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-copy">
          <p className="page-eyebrow">Secure civic participation</p>
          <h1>Your Voice. Your Vote. Your Future.</h1>
          <p>
            A secure and transparent digital voting platform for citizens, candidates,
            and election administrators.
          </p>
          <div className="hero-actions">
            <Link to="/auth/sign-up" className="btn">
              Get Started
            </Link>
            <a href="#features" className="btn btn-secondary">
              Learn More
            </a>
          </div>
        </div>

        <aside className="hero-panel" aria-label="Platform highlights">
          <div className="hero-illustration">
            <div className="mini-stat">
              <span>Verified voter access</span>
              <strong>99%</strong>
            </div>
            <div className="mini-stat">
              <span>Active election monitoring</span>
              <strong>24/7</strong>
            </div>
            <div className="mini-stat">
              <span>Registration review queue</span>
              <strong>Live</strong>
            </div>
          </div>
        </aside>
        </div>
    </section>
  );
}
