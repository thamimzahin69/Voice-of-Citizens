import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';

import Home from '../pages/Home/Home';
import FeatureDetail from '../pages/FeatureDetail/FeatureDetail';
import SignIn from '../pages/Auth/SignIn';
import SignUp from '../pages/Auth/SignUp';
import Overview from '../pages/Dashboard/Overview';
import AdminDashboard from '../pages/Dashboard/AdminDashboard';
import AdminCreateElection from '../pages/Dashboard/AdminCreateElection';
import JoinElection from '../pages/Dashboard/JoinElection';
import ElectionHistory from '../pages/Dashboard/ElectionHistory';
import Predictions from '../pages/Dashboard/Predictions';
import ComplaintsPageContainer from '../pages/Dashboard/ComplaintsPageContainer';
import ElectionDetails from '../pages/ElectionCenter/ElectionDetails'; // NEW
import FAQ from '../pages/FAQ/FAQ';
import Complaints from '../pages/Complaints/Complaints';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/features/:slug" element={<FeatureDetail />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/complaints" element={<Complaints />} />

        <Route path="/auth/sign-in" element={<SignIn />} />
        <Route path="/auth/sign-up" element={<SignUp />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* Dashboard layout routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/create" element={<AdminCreateElection />} />
            <Route path="join-election" element={<JoinElection />} />
            <Route path="history" element={<ElectionHistory />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="complaints" element={<ComplaintsPageContainer />} />
          </Route>

          {/* Election Details – standalone */}
          <Route path="/election/:id" element={<ElectionDetails />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}