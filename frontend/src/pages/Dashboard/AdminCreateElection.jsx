import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const initialElection = {
  mode: 'actual',
  type: 'class-captain',
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  area: '',
  votingType: 'majority',
  eligibilityRules: '',
  banner: null,
};

const emptyCandidate = () => ({ name: '', party: '', manifesto: '', image: null });

export default function AdminCreateElection() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [election, setElection] = useState(initialElection);
  const [candidates, setCandidates] = useState([emptyCandidate()]);
  const [status, setStatus] = useState(null);

  const canProceed = useMemo(() => {
    if (step === 1) return election.title.trim() && election.startDate && election.endDate;
    if (step === 2) return candidates.every((c) => c.name.trim() && c.manifesto.trim());
    return true;
  }, [step, election, candidates]);

  function updateElection(key, value) {
    setElection((prev) => ({ ...prev, [key]: value }));
  }

  function updateCandidate(index, newPartial) {
    setCandidates((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...newPartial };
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);

    try {
      const formData = new FormData();
      // Only append fields that backend expects
      const fieldsToSend = ['mode', 'type', 'title', 'description', 'votingType', 'area', 'startDate', 'endDate'];
      fieldsToSend.forEach((key) => {
        if (election[key] !== null && election[key] !== undefined) {
          formData.append(key, election[key]);
        }
      });
      
      formData.append('candidates', JSON.stringify(
        candidates.map((c) => ({ name: c.name, party: c.party, manifesto: c.manifesto })),
      ));
      candidates.forEach((c) => {
        if (c.image) formData.append('candidateImages', c.image, c.image.name);
      });

      const { data } = await apiClient.post('/elections', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStatus({ type: 'success', text: `Created election "${data.title}" successfully.` });
      setTimeout(() => navigate('/dashboard/admin'), 1200);
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message ?? 'Unable to create election.' });
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">Admin tools</p>
        <h1>Create Election</h1>
        <p>Configure election details, timeline, candidates, constituency, and eligibility rules.</p>
      </header>

      <div className="form-stepper">
        <div className={`step ${step === 1 ? 'active' : ''}`}>1. Election</div>
        <div className={`step ${step === 2 ? 'active' : ''}`}>2. Candidates</div>
        <div className={`step ${step === 3 ? 'active' : ''}`}>3. Review</div>
      </div>

      <form className="form-stack card wide-card" onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <label className="form-field">
              <span className="form-label">Election mode</span>
              <select value={election.mode} onChange={(e) => updateElection('mode', e.target.value)} className="form-input">
                <option value="actual">Actual election</option>
                <option value="testing">Testing election</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Election type</span>
              <select value={election.type} onChange={(e) => updateElection('type', e.target.value)} className="form-input">
                <option value="class-captain">Class captain</option>
                <option value="best-footballer">Best footballer</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <Input label="Election title" value={election.title} onChange={(e) => updateElection('title', e.target.value)} required />
            <label className="form-field">
              <span className="form-label">Election description</span>
              <textarea value={election.description} onChange={(e) => updateElection('description', e.target.value)} className="form-input" rows={3} />
            </label>
            <Input label="Start date and time" type="datetime-local" value={election.startDate} onChange={(e) => updateElection('startDate', e.target.value)} required />
            <Input label="End date and time" type="datetime-local" value={election.endDate} onChange={(e) => updateElection('endDate', e.target.value)} required />
            <Input label="Area / constituency" value={election.area} onChange={(e) => updateElection('area', e.target.value)} required />
            <label className="form-field">
              <span className="form-label">Voting Type</span>
              <select value={election.votingType} onChange={(e) => updateElection('votingType', e.target.value)} className="form-input" required>
                <option value="majority">Majority Voting</option>
                <option value="rankBased">Rank Based Voting</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Eligibility rules</span>
              <textarea
                value={election.eligibilityRules}
                onChange={(e) => updateElection('eligibilityRules', e.target.value)}
                className="form-input"
                rows={3}
                placeholder="Example: Registered voters from Dhaka North only."
              />
            </label>
            <label className="form-field">
              <span className="form-label">Upload election image/banner</span>
              <input type="file" accept="image/*" onChange={(e) => updateElection('banner', e.target.files?.[0] || null)} className="form-input" />
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <p className="notice">Add at least one candidate. Candidate name and manifesto are required.</p>
            {candidates.map((candidate, index) => (
              <fieldset key={index} className="card">
                <legend>Candidate {index + 1}</legend>
                <Input label="Candidate name" value={candidate.name} onChange={(e) => updateCandidate(index, { name: e.target.value })} required />
                <Input label="Party" value={candidate.party} onChange={(e) => updateCandidate(index, { party: e.target.value })} />
                <label className="form-field">
                  <span className="form-label">Manifesto</span>
                  <textarea value={candidate.manifesto} onChange={(e) => updateCandidate(index, { manifesto: e.target.value })} className="form-input" rows={3} required />
                </label>
                <label className="form-field">
                  <span className="form-label">Candidate picture</span>
                  <input type="file" accept="image/*" onChange={(e) => updateCandidate(index, { image: e.target.files?.[0] || null })} className="form-input" />
                </label>
                {candidates.length > 1 && (
                  <Button type="button" className="btn-danger" onClick={() => setCandidates((prev) => prev.filter((_, idx) => idx !== index))}>
                    Remove candidate
                  </Button>
                )}
              </fieldset>
            ))}
            <Button type="button" className="btn-secondary" onClick={() => setCandidates((prev) => [...prev, emptyCandidate()])}>
              Add candidate
            </Button>
          </>
        )}

        {step === 3 && (
          <section>
            <h2>Review</h2>
            <p><strong>Election:</strong> {election.title} ({election.type})</p>
            <p><strong>Window:</strong> {new Date(election.startDate).toLocaleString()} to {new Date(election.endDate).toLocaleString()}</p>
            <p><strong>Area:</strong> {election.area || 'Not specified'}</p>
            <p><strong>Voting Type:</strong> {election.votingType === 'majority' ? 'Majority Voting' : 'Rank Based Voting'}</p>
            <p>{election.description}</p>
            <h3>Candidates</h3>
            <ul>
              {candidates.map((c, index) => (
                <li key={index}><strong>{c.name}</strong> - {c.party || 'Independent'}<p>{c.manifesto}</p></li>
              ))}
            </ul>
          </section>
        )}

        <div className="form-actions">
          {step > 1 && <Button type="button" className="btn-secondary" onClick={() => setStep((s) => s - 1)}>Back</Button>}
          {step < 3 ? (
            <Button type="button" disabled={!canProceed} onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : (
            <Button type="submit" disabled={!canProceed}>Create Election</Button>
          )}
        </div>

        {status && <p className={status.type === 'error' ? 'form-error' : 'form-success'}>{status.text}</p>}
      </form>
    </section>
  );
}
