import { useAuth } from '../../context/AuthContext';
import ComplaintForm from '../../components/ComplaintForm';
import AdminComplaints from '../../components/AdminComplaints';

export default function ComplaintsPageContainer() {
  const { user, isAdmin } = useAuth();

  return isAdmin ? <AdminComplaints /> : <ComplaintForm />;
}