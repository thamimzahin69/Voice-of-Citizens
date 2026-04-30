import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function SignIn() {
  const navigate = useNavigate();
  const { signIn, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    try {
      const data = await signIn(form);
      navigate(data?.mustResetPassword ? '/dashboard/complete-profile' : '/dashboard/overview');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to sign in.');
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="page-eyebrow">Welcome back</p>
        <h1>Sign in to your account</h1>
        <p className="subtitle">Access your dashboard, elections, complaints, and voting history.</p>

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
          <Button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>
        </form>

        <p className="hint">
          Don't have an account? <Link to="/auth/sign-up" className="link">Sign up</Link>
        </p>
      </section>
    </main>
  );
}
