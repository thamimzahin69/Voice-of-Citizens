export default function CandidateCard({ candidate, onSelect }) {
  return (
    <div className="candidate-card" onClick={() => onSelect?.(candidate)}>
      <h4>{candidate.name}</h4>
      <p>{candidate.party}</p>
      <p className="manifesto-preview">{candidate.manifesto?.slice(0, 140)}...</p>
    </div>
  );
}
