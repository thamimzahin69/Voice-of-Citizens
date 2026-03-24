import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';

import Home from '../pages/Home/Home';
import FeatureDetail from '../pages/FeatureDetail/FeatureDetail';
import SignIn from '../pages/Auth/SignIn';
import SignUp from '../pages/Auth/SignUp';
import Overview from '../pages/Dashboard/Overview';
import CreateElection from '../pages/Dashboard/CreateElection';
import AdminDashboard from '../pages/Dashboard/AdminDashboard';
import AdminCreateElection from '../pages/Dashboard/AdminCreateElection';
import JoinElection from '../pages/Dashboard/JoinElection';
import ElectionHistory from '../pages/Dashboard/ElectionHistory';
import Predictions from '../pages/Dashboard/Predictions';
import ElectionCenter from '../pages/ElectionCenter/ElectionCenter';
import CandidateList from '../pages/ElectionCenter/CandidateList';
import ManifestoDetails from '../pages/ElectionCenter/ManifestoDetails';
import VotingInterface from '../pages/ElectionCenter/VotingInterface';
import ResultsBoard from '../pages/ElectionCenter/ResultsBoard';
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

        <Route element={<ProtectedRoute />}> 
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            {/* <Route path="create-election" element={<CreateElection />} /> */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/create" element={<AdminCreateElection />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/election/:electionId" element={<ElectionCenter />}>
            <Route index element={<Navigate to="candidates" replace />} />
            <Route path="candidates" element={<CandidateList />} />
            <Route path="manifesto" element={<ManifestoDetails />} />
            <Route path="vote" element={<VotingInterface />} />
            <Route path="results" element={<ResultsBoard />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
