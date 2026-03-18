/*import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ requireAdmin = false, redirectTo = '/auth/sign-in' }) {
  const { user, isAdmin } = useAuth();

  if (!user) return <Navigate to={redirectTo} replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}*/

import { Navigate, Outlet } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext'; // <-- TEMPORARILY COMMENTED OUT

export default function ProtectedRoute({ requireAdmin = false, redirectTo = '/auth/sign-in' }) {
  // const { user, isAdmin } = useAuth(); // <-- TEMPORARILY COMMENTED OUT

  // --- QUICK HACK: FORCE AUTHENTICATION FOR UI DEVELOPMENT ---
  const user = true;    // Fools the router into thinking you are logged in
  const isAdmin = true; // Fools the router into thinking you are an Admin
  // -----------------------------------------------------------

  if (!user) return <Navigate to={redirectTo} replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  
  return <Outlet />;
}
