import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    nid: '',
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('email', form.email);
      data.append('password', form.password);
      data.append('nid', form.nid);
      if (documentFile) data.append('document', documentFile);

      const response = await signUp(data);
      if (response.token) {
        navigate('/dashboard/overview');
      } else {
        setSuccess('Registration request submitted. An admin will review your account shortly.');
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to register.');
    }
  }

  return (
    <main className="page auth-page">
      <h1>Sign Up</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label="Full Name"
          name="name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          required
        />
        <Input
          label="National ID (NID)"
          name="nid"
          value={form.nid}
          onChange={(e) => setForm((prev) => ({ ...prev, nid: e.target.value }))}
          required
        />
        <label className="form-field">
          <span className="form-label">Upload NID Document</span>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
            className="form-input"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}
        <Button type="submit">Create account</Button>
      </form>
      <p className="hint">
        Already have an account? <Link to="/auth/sign-in">Sign in</Link>
      </p>
    </main>
  );
}
