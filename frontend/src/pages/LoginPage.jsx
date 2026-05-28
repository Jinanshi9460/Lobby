import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const LoginPage = ({ roleHint = 'student' }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const googleBtnRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId) return undefined;
    const existing = document.getElementById('google-identity-script');
    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async response => {
          try {
            const { data } = await api.post('/auth/google', {
              credential: response.credential,
              role: roleHint === 'vendor' ? 'vendor' : 'student',
              mode: 'login'
            });
            if (roleHint === 'vendor' && data.user.role !== 'vendor') {
              throw new Error('This Google account is not set as vendor.');
            }
            login({ token: data.token, user: data.user });
            navigate(data.user.role === 'vendor' ? '/vendor' : '/');
          } catch (err) {
            setError(err.message || 'Google sign-in failed');
          }
        }
      });
      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
        width: 320
      });
    };

    if (existing) {
      initializeGoogle();
      return undefined;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);
    return () => {};
  }, [googleClientId, login, navigate, roleHint]);

  const onSubmit = async e => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', form);
      if (roleHint === 'vendor' && data.user.role !== 'vendor') {
        throw new Error('This account is not registered as a vendor.');
      }
      login({ token: data.token, user: data.user });
      navigate(data.user.role === 'vendor' ? '/vendor' : '/');
    } catch (err) {
      setError(err.message || 'Failed to login');
    }
  };

  return (
    <div className="glass-card mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold text-white">{roleHint === 'vendor' ? 'Vendor Login' : 'Customer Login'}</h1>
      <p className="mt-2 text-slate-300">
        {roleHint === 'vendor'
          ? 'Manage your shop, inventory, and products from the vendor side.'
          : 'Access student deals, track orders, and chat with campus vendors.'}
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" placeholder="you@campus.edu" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Password</label>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" placeholder="••••••••" required />
          <div className="pt-2 text-right">
            <Link to={roleHint === 'vendor' ? '/vendor/forgot-password' : '/forgot-password'} className="text-xs text-cyan-300 underline hover:text-cyan-200">
              Forgot password?
            </Link>
          </div>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button type="submit" className="w-full rounded-3xl bg-cyan-400 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-300">Sign in</button>
      </form>
      {googleClientId && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <p className="mb-3 text-center text-sm text-slate-400">Or continue with Google</p>
          <div ref={googleBtnRef} className="flex justify-center" />
        </div>
      )}
      {!googleClientId && (
        <div className="mt-6 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-xs text-amber-200">
          Google login not configured. Add <code>VITE_GOOGLE_CLIENT_ID</code> in <code>frontend/.env</code>.
        </div>
      )}
    </div>
  );
};

export default LoginPage;
