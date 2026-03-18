import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ requireAdmin = false, redirectTo = '/auth/sign-in' }) {
  const { user, isAdmin } = useAuth();

  if (!user) return <Navigate to={redirectTo} replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
