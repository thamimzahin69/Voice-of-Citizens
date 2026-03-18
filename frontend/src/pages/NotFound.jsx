import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="page">
      <h1>Page not found</h1>
      <p>The page you are looking for doesn’t exist.</p>
      <Link to="/" className="btn">
        Return to home
      </Link>
    </main>
  );
}
