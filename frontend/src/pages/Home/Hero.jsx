export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Welcome to Voice of Citizens</h1>
        <p>
          A modern Election &amp; Voting Management System built to empower citizens and
          streamline administration.
        </p>
        <div className="hero-actions">
          <a href="#features" className="btn">
            Explore Features
          </a>
          <a href="/auth/sign-in" className="btn btn-secondary">
            Sign in / Register
          </a>
        </div>
      </div>
    </section>
  );
}
