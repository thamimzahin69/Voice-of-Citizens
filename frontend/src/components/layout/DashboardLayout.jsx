import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout() {
  const { user, signOut, isAdmin } = useAuth();

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <strong>Dashboard</strong>
          <div className="user-meta">
            <span>{user?.name || user?.email}</span>
            <span className="role">{isAdmin ? 'Admin' : 'Voter'}</span>
          </div>
        </div>
        <nav className="dashboard-nav">
          <NavLink to="overview">Overview</NavLink>
          <NavLink to="create-election">Create Election</NavLink>
          {isAdmin && <NavLink to="admin">Admin panel</NavLink>}
          <NavLink to="join-election">Join Election</NavLink>
          <NavLink to="history">History</NavLink>
          <NavLink to="predictions">Predictions</NavLink>
        </nav>
        <button type="button" className="sign-out" onClick={signOut}>
          Sign out
        </button>
      </aside>
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
