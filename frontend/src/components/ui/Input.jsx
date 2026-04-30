export default function Input({ label, name, value, onChange, type = 'text', placeholder, required, ...props }) {
  return (
    <label className="form-field">
      {label && <span className="form-label">{label}</span>}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="form-input"
        {...props}
      />
    </label>
  );
}
