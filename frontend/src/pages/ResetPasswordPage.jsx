import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      setMessage(data.message || 'Password reset successful.');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    }
  };

  return (
    <div className="glass-card mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold text-white">Set New Password</h1>
      <p className="mt-2 text-slate-300">Choose a new password (minimum 8 characters).</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div className="space-y-2">
          <label className="text-sm text-slate-300">New password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" required minLength={8} />
        </div>
        {message && <p className="text-sm text-emerald-300">{message}</p>}
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button type="submit" className="w-full rounded-3xl bg-cyan-400 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-300">
          Reset password
        </button>
        <Link to="/login" className="block text-center text-sm text-slate-300 underline">Back to login</Link>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
