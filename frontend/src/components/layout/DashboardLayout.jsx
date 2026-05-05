import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout() {
  const { user, signOut, isAdmin } = useAuth();

  const commonItems = [
    { to: 'overview', label: 'Overview', icon: 'Dashboard' },
    { to: 'join-election', label: 'Join Election', icon: 'Ballot' },
    { to: 'history', label: 'History', icon: 'History' },
    { to: 'recurrent', label: 'Recurrent Elections', icon: 'Ballot' },
    { to: 'complaints', label: 'Complaints', icon: 'Help' },
    { to: 'chats', label: 'Chats', icon: 'Chat' },
  ];

  const adminItems = [
    { to: 'overview', label: 'Overview', icon: 'Dashboard' },
    { to: 'admin/create', label: 'Create Election', icon: 'Create' },
    { to: 'join-election', label: 'Join Election', icon: 'Ballot' },
    { to: 'history', label: 'History', icon: 'History' },
    { to: 'recurrent', label: 'Recurrent Elections', icon: 'Ballot' },
    { to: 'admin/approvals', label: 'Review User Registration', icon: 'Review' },
    { to: 'admin/bulk-users', label: 'Bulk Add User', icon: 'Import' },
    { to: 'complaints', label: 'Complaints', icon: 'Help' },
    { to: 'user-log', label: 'User Log', icon: 'Logs' },
    { to: 'chats', label: 'Chats', icon: 'Chat' },
  ];

  const navItems = isAdmin ? adminItems : commonItems;

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-kicker">Voice of Citizens</div>
          <strong className="brand-mark">Dashboard</strong>
          <div className="user-meta">
            <strong>{user?.name || user?.email || 'Citizen'}</strong>
            <span className="role">{isAdmin ? 'ADMIN' : 'USER'}</span>
          </div>
        </div>
        <nav className="dashboard-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
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
