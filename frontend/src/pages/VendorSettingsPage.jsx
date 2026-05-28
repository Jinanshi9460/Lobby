import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const fetchVendorProfile = async () => {
  const { data } = await api.get('/vendors/me');
  return data.vendor;
};

const fetchVendorOrders = async () => {
  const { data } = await api.get('/orders');
  return data.orders || [];
};

const fetchVendorProducts = async () => {
  const { data } = await api.get('/vendors/products');
  return data.products || [];
};

const VendorSettingsPage = () => {
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const { data: vendor } = useQuery({ queryKey: ['vendorProfile'], queryFn: fetchVendorProfile });
  const { data: orders = [] } = useQuery({ queryKey: ['vendorOrders'], queryFn: fetchVendorOrders });
  const { data: products = [] } = useQuery({ queryKey: ['vendorProducts'], queryFn: fetchVendorProducts });
  const [phone, setPhone] = useState('');

  const updateMutation = useMutation({
    mutationFn: payload => api.put('/vendors/settings', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProfile'] });
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    }
  });

  const currentPhone = phone || vendor?.contactNumber || vendor?.user?.phone || '';

  return (
    <div className="space-y-6">
      <section className="glass-card p-8">
        <h1 className="text-3xl font-semibold text-white">Vendor Settings</h1>
        <p className="mt-2 text-slate-300">Manage mart profile, orders, products, and store operations.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Products</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-300">{products.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Orders</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-300">{orders.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Store Rating</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-300">{vendor?.rating?.toFixed?.(1) || '0.0'}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white">Mart Profile Settings</h2>
          <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-200">
            <div className="flex items-center justify-between">
              <span>Theme</span>
              <button type="button" onClick={toggleTheme} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-100">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
            <p>Store: <span className="font-semibold text-slate-100">{vendor?.storeName || 'N/A'}</span></p>
            <p className="mt-1">Email: <span className="font-semibold text-slate-100">{vendor?.user?.email || 'N/A'}</span></p>
          </div>
          <div className="mt-4 space-y-2">
            <label className="text-sm text-slate-300">Phone number</label>
            <input value={currentPhone} onChange={e => setPhone(e.target.value)} className="w-full border border-white/15 bg-slate-900/70 p-4 text-slate-100" />
          </div>
          <button
            onClick={() => updateMutation.mutate({ phone: currentPhone })}
            disabled={updateMutation.isPending}
            className="mt-4 w-full rounded-3xl bg-cyan-400 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save mart settings'}
          </button>
          {updateMutation.isSuccess && <p className="mt-3 text-sm text-emerald-300">Settings saved.</p>}
          {updateMutation.isError && <p className="mt-3 text-sm text-rose-300">{updateMutation.error?.message || 'Failed to save settings'}</p>}
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white">Vendor Tools</h2>
          <div className="mt-4 grid gap-3">
            <Link to="/vendor" className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10">Dashboard & Analytics</Link>
            <Link to="/vendor" className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10">Manage Products</Link>
            <Link to="/vendor" className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10">Inventory & Pricing</Link>
          </div>
          <div className="mt-6 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-4 text-sm text-cyan-100">
            Need seller help? Contact vendor support at <span className="font-semibold">seller-support@lobby.app</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VendorSettingsPage;
