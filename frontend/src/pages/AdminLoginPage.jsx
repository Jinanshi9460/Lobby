import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const AdminLoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '', adminKey: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async e => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login/admin', form);
      login({ token: data.token, user: data.user });
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Admin login failed');
    }
  };

  return (
    <div className="glass-card mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold text-white">Admin Secure Login</h1>
      <p className="mt-2 text-slate-300">Restricted access. Admin account creation is disabled.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <input type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" placeholder="admin@domain.com" required />
        <input type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" placeholder="Password" required />
        <input type="password" value={form.adminKey} onChange={e => setForm(prev => ({ ...prev, adminKey: e.target.value }))} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" placeholder="Admin access key" />
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button type="submit" className="w-full rounded-3xl bg-cyan-400 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-300">Enter Admin Panel</button>
      </form>
    </div>
  );
};

export default AdminLoginPage;
