import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function SignIn() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    try {
      await signIn(form);
      navigate('/dashboard/overview');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to sign in.');
    }
  }

  return (
    <main className="page auth-page">
      <h1>Sign In</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
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
        {error && <p className="form-error">{error}</p>}
        <Button type="submit">Sign in</Button>
      </form>
      <p className="hint">
        Don’t have an account? <Link to="/auth/sign-up">Sign up</Link>
      </p>
    </main>
  );
}
