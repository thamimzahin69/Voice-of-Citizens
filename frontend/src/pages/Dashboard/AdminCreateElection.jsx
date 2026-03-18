import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const initialElection = {
  type: 'class-captain',
  title: '',
  description: '',
  startDate: '',
  endDate: '',
};

const emptyCandidate = () => ({ name: '', party: '', manifesto: '', image: null });

export default function AdminCreateElection() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [election, setElection] = useState(initialElection);
  const [candidates, setCandidates] = useState([emptyCandidate()]);
  const [status, setStatus] = useState(null);

  const canProceed = useMemo(() => {
    if (step === 1) {
      return election.title.trim() && election.startDate && election.endDate;
    }
    if (step === 2) {
      return candidates.every((c) => c.name.trim() && c.manifesto.trim());
    }
    return true;
  }, [step, election, candidates]);

  function updateCandidate(index, newPartial) {
    setCandidates((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...newPartial };
      return next;
    });
  }

  function addCandidate() {
    setCandidates((prev) => [...prev, emptyCandidate()]);
  }

  function removeCandidate(index) {
    setCandidates((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append('type', election.type);
      formData.append('title', election.title);
      formData.append('description', election.description);
      formData.append('startDate', election.startDate);
      formData.append('endDate', election.endDate);

      formData.append('candidates', JSON.stringify(
        candidates.map((c) => ({ name: c.name, party: c.party, manifesto: c.manifesto })),
      ));

      candidates.forEach((c, index) => {
        if (c.image) {
          formData.append('candidateImages', c.image, c.image.name);
        }
      });

      const { data } = await apiClient.post('/elections', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStatus({ type: 'success', text: `Created election “${data.title}” successfully.` });
      setTimeout(() => navigate('/dashboard/admin'), 1200);
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message ?? 'Unable to create election.' });
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Create Election</h1>
        <p>Configure election type, candidates, and manifesto details (admin-only).</p>
      </header>

      <div className="form-stepper">
        <div className={`step ${step === 1 ? 'active' : ''}`}>1. Election</div>
        <div className={`step ${step === 2 ? 'active' : ''}`}>2. Candidates</div>
        <div className={`step ${step === 3 ? 'active' : ''}`}>3. Review</div>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <label className="form-field">
              <span className="form-label">Election type</span>
              <select
                value={election.type}
                onChange={(e) => setElection((prev) => ({ ...prev, type: e.target.value }))}
                className="form-input"
              >
                <option value="class-captain">Class captain</option>
                <option value="best-footballer">Best footballer</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <Input
              label="Title"
              name="title"
              value={election.title}
              onChange={(e) => setElection((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <label className="form-field">
              <span className="form-label">Description</span>
              <textarea
                value={election.description}
                onChange={(e) => setElection((prev) => ({ ...prev, description: e.target.value }))}
                className="form-input"
                rows={3}
              />
            </label>
            <Input
              label="Start date"
              name="startDate"
              type="datetime-local"
              value={election.startDate}
              onChange={(e) => setElection((prev) => ({ ...prev, startDate: e.target.value }))}
              required
            />
            <Input
              label="End date"
              name="endDate"
              type="datetime-local"
              value={election.endDate}
              onChange={(e) => setElection((prev) => ({ ...prev, endDate: e.target.value }))}
              required
            />
          </>
        )}

        {step === 2 && (
          <>
            <p>Add at least one candidate (name + manifesto are required).</p>
            {candidates.map((candidate, index) => (
              <fieldset key={index} className="card">
                <legend>Candidate {index + 1}</legend>
                <Input
                  label="Name"
                  name={`candidateName-${index}`}
                  value={candidate.name}
                  onChange={(e) => updateCandidate(index, { name: e.target.value })}
                  required
                />
                <Input
                  label="Party"
                  name={`candidateParty-${index}`}
                  value={candidate.party}
                  onChange={(e) => updateCandidate(index, { party: e.target.value })}
                />
                <label className="form-field">
                  <span className="form-label">Manifesto</span>
                  <textarea
                    value={candidate.manifesto}
                    onChange={(e) => updateCandidate(index, { manifesto: e.target.value })}
                    className="form-input"
                    rows={3}
                    required
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Candidate picture</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => updateCandidate(index, { image: e.target.files?.[0] || null })}
                    className="form-input"
                  />
                </label>
                <div className="form-actions">
                  {candidates.length > 1 && (
                    <Button type="button" className="btn-secondary" onClick={() => removeCandidate(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              </fieldset>
            ))}
            <Button type="button" onClick={addCandidate} className="btn-secondary">
              Add candidate
            </Button>
          </>
        )}

        {step === 3 && (
          <section className="card">
            <h2>Review</h2>
            <p>
              <strong>Election:</strong> {election.title} ({election.type})
            </p>
            <p>
              <strong>Window:</strong> {new Date(election.startDate).toLocaleString()} —{' '}
              {new Date(election.endDate).toLocaleString()}
            </p>
            <p>{election.description}</p>

            <h3>Candidates</h3>
            <ul>
              {candidates.map((c, index) => (
                <li key={index}>
                  <strong>{c.name}</strong> — {c.party || 'Independent'}
                  <p>{c.manifesto}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="form-actions">
          {step > 1 && (
            <Button type="button" className="btn-secondary" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" disabled={!canProceed} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={!canProceed}>
              Create election
            </Button>
          )}
        </div>

        {status && <p className={status.type === 'error' ? 'form-error' : 'form-success'}>{status.text}</p>}
      </form>
    </section>
  );
}
