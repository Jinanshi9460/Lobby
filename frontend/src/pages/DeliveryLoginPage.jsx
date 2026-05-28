import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const DeliveryLoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password
      };
      const { data } = await api.post('/auth/login', payload);
      if (data.user.role !== 'delivery') {
        throw new Error('This account is not a delivery partner.');
      }
      login({ token: data.token, user: data.user });
      navigate('/delivery');
    } catch (err) {
      setError(err?.message || err?.error || 'Failed to login');
    }
  };

  return (
    <div className="glass-card mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold text-white">Delivery partner login</h1>
      <p className="mt-2 text-slate-300">Confirm deliveries using the OTP the customer shares with you at handoff.</p>
      <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
        Demo: <span className="text-slate-200">delivery@lobby.com</span> / <span className="text-slate-200">DeliveryPass123</span>
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" placeholder="delivery@lobby.com" required />
        <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" placeholder="Password" required />
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button type="submit" className="w-full rounded-3xl bg-cyan-400 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-300">Sign in</button>
      </form>
    </div>
  );
};

export default DeliveryLoginPage;
