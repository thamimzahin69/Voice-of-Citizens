export default function Button({ children, type = 'button', onClick, className = '' }) {
  return (
    <button type={type} className={`btn ${className}`.trim()} onClick={onClick}>
      {children}
    </button>
  );
}
