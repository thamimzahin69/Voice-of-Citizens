import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token and FormData handling
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// ========== Election APIs ==========
export const fetchElections = () => apiClient.get('/elections');          // GET /api/elections (all, enriched)
export const fetchElectionDetails = (id) => apiClient.get(`/elections/${id}`); // GET /api/elections/:id
export const castVote = (electionId, candidateId, nid) => 
  apiClient.post(`/elections/${electionId}/vote`, { candidateId, nid });

// ========== Join Election APIs ==========
export const fetchJoinableElections = () => apiClient.get('/elections/joinable');
export const joinElection = (electionId) => apiClient.post(`/elections/${electionId}/join`);

// ========== Results & Predictions ==========
export const fetchResults = (electionId) => apiClient.get(`/elections/${electionId}/results`);
export const fetchPredictions = () => apiClient.get('/elections/predictions');

// ========== Admin / Create Election ==========
export const createElection = (formData) => apiClient.post('/elections', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// ========== Other existing APIs (add as needed) ==========
export const fetchActiveElections = () => apiClient.get('/elections/active');
export const fetchElectionHistory = () => apiClient.get('/elections/history');
export const fetchCandidates = (electionId) => apiClient.get(`/elections/${electionId}/candidates`);
export const fetchManifestos = (electionId) => apiClient.get(`/elections/${electionId}/manifestos`);
export const getElectionStatus = (electionId) => apiClient.get(`/elections/${electionId}/status`);

export default apiClient;