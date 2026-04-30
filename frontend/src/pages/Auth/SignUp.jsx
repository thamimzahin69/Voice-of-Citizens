import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, loading } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nid: '',
    area: '',
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('email', form.email);
      data.append('password', form.password);
      data.append('nid', form.nid);
      data.append('area', form.area);
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

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="page-eyebrow">Voter registration</p>
        <h1>Create your account</h1>
        <p className="subtitle">
          Your account may require admin approval before you can join elections or cast votes.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input label="Full name" name="name" value={form.name} onChange={update('name')} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={update('email')} required />
          <Input label="Password" name="password" type="password" value={form.password} onChange={update('password')} required />
          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            required
          />
          <Input label="NID number" name="nid" value={form.nid} onChange={update('nid')} required />
          <Input label="Area" name="area" value={form.area} onChange={update('area')} required placeholder="e.g., City, Region, District" />
          <label className="form-field">
            <span className="form-label">Upload NID Document</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
              onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
              className="form-input"
            />
            <small className="text-gray-600">Accepted file types: PDF, JPG, PNG.</small>
          </label>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}
          <Button type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</Button>
        </form>

        <p className="hint">
          Already have an account? <Link to="/auth/sign-in" className="link">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
