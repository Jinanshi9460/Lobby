import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const RegisterPage = ({ roleHint = 'student' }) => {
  const isVendorFlow = roleHint === 'vendor';
  const googleBtnRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: isVendorFlow ? 'vendor' : 'student',
    storeName: '',
    storeDescription: '',
    campus: '',
    address: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

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
              role: isVendorFlow ? 'vendor' : 'student',
              mode: 'register'
            });
            if (data.approvalPending) {
              setError('');
              setInfo(data.message || 'Admin approval pending. Please login after approval.');
              return;
            }
            login({ token: data.token, user: data.user });
            navigate(data.user.role === 'vendor' ? '/vendor' : '/');
          } catch (err) {
            setError(err.message || 'Google sign-up failed');
          }
        }
      });
      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'signup_with',
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
  }, [googleClientId, isVendorFlow, login, navigate]);

  const onSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        role: isVendorFlow ? 'vendor' : 'student'
      };
      const { data } = await api.post('/auth/register', payload);
      if (data.approvalPending) {
        setError('');
        setInfo(data.message || 'Admin approval pending. Please login after approval.');
        return;
      }
      login({ token: data.token, user: data.user });
      navigate(data.user.role === 'vendor' ? '/vendor' : '/');
    } catch (err) {
      setError(err.message || 'Failed to register');
    }
  };

  return (
    <div className="glass-card mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold text-white">{isVendorFlow ? 'Create Vendor Account' : 'Create Customer Account'}</h1>
      <p className="mt-2 text-slate-300">
        {isVendorFlow
          ? 'Register your campus store and start managing products.'
          : 'Join campus shoppers and discover vendor offers around your university.'}
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" required />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Password</label>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" required />
        </div>
        {isVendorFlow && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Store name</label>
              <input type="text" value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Campus</label>
              <input type="text" value={form.campus} onChange={e => setForm({ ...form, campus: e.target.value })} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" placeholder="Main Campus" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-300">Phone number</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" placeholder="Enter vendor phone number" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-300">Store description</label>
              <input type="text" value={form.storeDescription} onChange={e => setForm({ ...form, storeDescription: e.target.value })} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-300">Store address</label>
              <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" />
            </div>
          </div>
        )}
        {info && <p className="text-sm text-emerald-300">{info}</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button type="submit" className="w-full rounded-3xl bg-cyan-400 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-300">Register</button>
      </form>
      {googleClientId && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <p className="mb-3 text-center text-sm text-slate-400">Or continue with Google</p>
          <div ref={googleBtnRef} className="flex justify-center" />
        </div>
      )}
      {!googleClientId && (
        <div className="mt-6 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-xs text-amber-200">
          Google sign-up not configured. Add <code>VITE_GOOGLE_CLIENT_ID</code> in <code>frontend/.env</code>.
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
