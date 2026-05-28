import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPasswordPage = ({ roleHint = 'student' }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetUrl, setResetUrl] = useState('');

  const onSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setError('');
    setResetUrl('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message || 'Password reset link generated.');
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch (err) {
      setError(err.message || 'Failed to generate reset link');
    }
  };

  return (
    <div className="glass-card mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold text-white">{roleHint === 'vendor' ? 'Vendor Password Reset' : 'Customer Password Reset'}</h1>
      <p className="mt-2 text-slate-300">Enter your account email and generate a reset link.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" placeholder="you@campus.edu" required />
        </div>
        {message && <p className="text-sm text-emerald-300">{message}</p>}
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {resetUrl && (
          <a href={resetUrl} className="inline-block rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
            Open reset page
          </a>
        )}
        <button type="submit" className="w-full rounded-3xl bg-cyan-400 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-300">
          Generate reset link
        </button>
        <Link to={roleHint === 'vendor' ? '/vendor/login' : '/login'} className="block text-center text-sm text-slate-300 underline">
          Back to login
        </Link>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
