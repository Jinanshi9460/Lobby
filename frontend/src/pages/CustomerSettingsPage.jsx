import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const fetchOrders = async () => {
  const { data } = await api.get('/orders');
  return data.orders || [];
};

const CustomerSettingsPage = () => {
  const { user, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: fetchOrders });
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [preferences, setPreferences] = useState({
    orderAlerts: true,
    offerNotifications: true,
    smsUpdates: false
  });

  useEffect(() => {
    const stored = localStorage.getItem('lobby_customer_preferences');
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch {
        // Ignore invalid persisted preferences.
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lobby_customer_preferences', JSON.stringify(preferences));
  }, [preferences]);

  const updateMutation = useMutation({
    mutationFn: payload => api.put('/users/profile', payload),
    onSuccess: ({ data }) => {
      login({ token: localStorage.getItem('lobby_token'), user: data.user });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  return (
    <div className="space-y-6">
      <section className="glass-card p-8">
        <h1 className="text-3xl font-semibold text-white">Customer Settings</h1>
        <p className="mt-2 text-slate-300">Manage account, orders, preferences, and support options.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Total Orders</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-300">{orders.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Active User</p>
            <p className="mt-2 text-base font-semibold text-slate-100">{user?.name}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Support</p>
            <p className="mt-2 text-base font-semibold text-slate-100">24x7 Chat + Call</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white">Account Details</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Name</label>
              <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Phone number</label>
              <input value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" />
            </div>
            <button
              onClick={() => updateMutation.mutate({ name: form.name, phone: form.phone })}
              disabled={updateMutation.isPending}
              className="w-full rounded-3xl bg-cyan-400 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save account details'}
            </button>
            {updateMutation.isSuccess && <p className="text-sm text-emerald-300">Account settings saved.</p>}
            {updateMutation.isError && <p className="text-sm text-rose-300">{updateMutation.error?.message || 'Failed to save settings'}</p>}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            <Link to="/orders" className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10">My Orders</Link>
            <Link to="/cart" className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10">Cart & Checkout</Link>
            <Link to="/notifications" className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10">Notifications</Link>
            <Link to="/profile" className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10">Address & Profile</Link>
          </div>
          <h3 className="mt-6 text-lg font-semibold text-white">Preferences</h3>
          <div className="mt-3 space-y-3">
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
              Theme
              <button type="button" onClick={toggleTheme} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-100">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </label>
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
              Order alerts
              <input type="checkbox" checked={preferences.orderAlerts} onChange={e => setPreferences(prev => ({ ...prev, orderAlerts: e.target.checked }))} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
              Offer notifications
              <input type="checkbox" checked={preferences.offerNotifications} onChange={e => setPreferences(prev => ({ ...prev, offerNotifications: e.target.checked }))} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
              SMS updates
              <input type="checkbox" checked={preferences.smsUpdates} onChange={e => setPreferences(prev => ({ ...prev, smsUpdates: e.target.checked }))} />
            </label>
          </div>
          <div className="mt-6 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-4 text-sm text-cyan-100">
            Need help? Contact support at <span className="font-semibold">support@lobby.app</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerSettingsPage;
