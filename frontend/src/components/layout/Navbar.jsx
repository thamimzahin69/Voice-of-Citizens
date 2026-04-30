import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="app-navbar">
      <div className="container nav-inner">
        <Link to="/" className="logo">
          Voice of Citizens
        </Link>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/features/overview">Features</Link>
          <Link to="/faq">FAQ</Link>
          {user ? (
            <>
              <Link to="/dashboard/overview">Dashboard</Link>
              <button type="button" className="link-button" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth/sign-in">Sign in</Link>
              <Link to="/auth/sign-up" className="nav-cta">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
