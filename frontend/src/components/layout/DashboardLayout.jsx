import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Vote,
  History,
  Repeat,
  AlertCircle,
  MessageSquare,
  PlusCircle,
  UserCheck,
  Users,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const iconMap = {
  LayoutDashboard,
  PlusCircle,
  Vote,
  History,
  Repeat,
  UserCheck,
  Users,
  AlertCircle,
  FileText,
  MessageSquare,
};

export default function DashboardLayout() {
  const { user, signOut, isAdmin } = useAuth();

  const commonItems = [
    { to: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
    { to: 'join-election', label: 'Join Election', icon: 'Vote' },
    { to: 'history', label: 'History', icon: 'History' },
    { to: 'recurrent', label: 'Recurrent Elections', icon: 'Repeat' },
    { to: 'complaints', label: 'Complaints', icon: 'AlertCircle' },
    { to: 'chats', label: 'Chats', icon: 'MessageSquare' },
  ];

  const adminItems = [
    { to: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
    { to: 'admin/create', label: 'Create Election', icon: 'PlusCircle' },
    { to: 'join-election', label: 'Join Election', icon: 'Vote' },
    { to: 'history', label: 'History', icon: 'History' },
    { to: 'recurrent', label: 'Recurrent Elections', icon: 'Repeat' },
    { to: 'admin/approvals', label: 'Review User Registration', icon: 'UserCheck' },
    { to: 'admin/bulk-users', label: 'Bulk Add User', icon: 'Users' },
    { to: 'complaints', label: 'Complaints', icon: 'AlertCircle' },
    { to: 'user-log', label: 'User Log', icon: 'FileText' },
    { to: 'chats', label: 'Chats', icon: 'MessageSquare' },
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
          {navItems.map((item) => {
            const IconComponent = iconMap[item.icon];
            const isRecurrent = item.to === 'recurrent';
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg font-bold
                  transition-all duration-200 transform hover:scale-105
                  ${
                    isActive
                      ? isRecurrent
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-blue-100 text-blue-600'
                      : isRecurrent
                      ? 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }
                `}
              >
                {IconComponent && <IconComponent size={20} strokeWidth={2} />}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
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
