export default function Card({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`.trim()}>
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-body">{children}</div>
    </div>
  );
}
