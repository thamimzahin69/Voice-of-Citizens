import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth();

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
          <Link to="/complaints">Complaints</Link>
          {user ? (
            <>
              <Link to="/dashboard/overview">Dashboard</Link>
              {isAdmin && <Link to="/dashboard/admin">Admin</Link>}
              <button type="button" className="link-button" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth/sign-in">Sign In</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
