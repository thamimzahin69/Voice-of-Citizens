export default function Button({ children, type = 'button', onClick, className = '', ...props }) {
  return (
    <button type={type} className={`btn ${className}`.trim()} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
