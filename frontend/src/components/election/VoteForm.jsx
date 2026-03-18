import { useState } from 'react';
import Button from '../ui/Button';

export default function VoteForm({ candidates = [], onSubmit }) {
  const [selectedCandidate, setSelectedCandidate] = useState('');

  return (
    <form
      className="vote-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!selectedCandidate) return;
        onSubmit(selectedCandidate);
      }}
    >
      <h3>Cast your vote</h3>
      <select
        value={selectedCandidate}
        onChange={(e) => setSelectedCandidate(e.target.value)}
        className="form-input"
      >
        <option value="" disabled>
          Select a candidate
        </option>
        {candidates.map((c) => (
          <option key={c._id ?? c.id} value={c._id ?? c.id}>
            {c.name} ({c.party})
          </option>
        ))}
      </select>
      <Button type="submit" className="mt-2">
        Submit vote
      </Button>
    </form>
  );
}
