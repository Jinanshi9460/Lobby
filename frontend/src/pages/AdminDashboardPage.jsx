import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import Loader from '../components/Loader';

const fetchAdminStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data;
};

const fetchVendors = async () => {
  const { data } = await api.get('/admin/vendors');
  return data.vendors;
};

const fetchShops = async () => {
  const { data } = await api.get('/admin/shops');
  return data.shops;
};

const fetchProducts = async () => {
  const { data } = await api.get('/admin/products');
  return data.products;
};

const AdminDashboardPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [exportRange, setExportRange] = useState({ from: '', to: '' });
  const { data, isLoading } = useQuery({ queryKey: ['adminStats'], queryFn: fetchAdminStats });
  const { data: vendors = [] } = useQuery({ queryKey: ['adminVendors'], queryFn: fetchVendors });
  const { data: shops = [] } = useQuery({ queryKey: ['adminShops'], queryFn: fetchShops });
  const { data: products = [] } = useQuery({ queryKey: ['adminProducts'], queryFn: fetchProducts });

  const approveVendorMutation = useMutation({
    mutationFn: id => api.put(`/admin/vendors/${id}/approve`),
    onSuccess: () => {
      setActionError('');
      setActionMessage('Vendor approved successfully.');
      queryClient.invalidateQueries({ queryKey: ['adminVendors'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: error => {
      setActionMessage('');
      setActionError(error?.message || 'Unable to approve vendor.');
    }
  });
  const rejectVendorMutation = useMutation({
    mutationFn: id => api.put(`/admin/vendors/${id}/reject`),
    onSuccess: () => {
      setActionError('');
      setActionMessage('Vendor status updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['adminVendors'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: error => {
      setActionMessage('');
      setActionError(error?.message || 'Unable to update vendor status.');
    }
  });
  const removeVendorMutation = useMutation({
    mutationFn: id => api.delete(`/admin/vendors/${id}`),
    onSuccess: () => {
      setActionError('');
      setActionMessage('Vendor removed successfully.');
      queryClient.invalidateQueries({ queryKey: ['adminVendors'] });
      queryClient.invalidateQueries({ queryKey: ['adminShops'] });
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: error => {
      setActionMessage('');
      setActionError(error?.message || 'Unable to remove vendor.');
    }
  });
  const toggleShopMutation = useMutation({
    mutationFn: id => api.put(`/admin/shops/${id}/toggle`),
    onSuccess: () => {
      setActionError('');
      setActionMessage('Shop availability updated.');
      queryClient.invalidateQueries({ queryKey: ['adminShops'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: error => {
      setActionMessage('');
      setActionError(error?.message || 'Unable to update shop status.');
    }
  });
  const toggleProductMutation = useMutation({
    mutationFn: id => api.put(`/admin/products/${id}/toggle`),
    onSuccess: () => {
      setActionError('');
      setActionMessage('Product status updated.');
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: error => {
      setActionMessage('');
      setActionError(error?.message || 'Unable to update product status.');
    }
  });
  const exportCsvMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (exportRange.from) params.set('from', exportRange.from);
      if (exportRange.to) params.set('to', exportRange.to);
      const query = params.toString();
      const response = await api.get(`/admin/export/csv${query ? `?${query}` : ''}`, {
        responseType: 'blob'
      });
      return response.data;
    },
    onSuccess: blob => {
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `admin-report-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setActionError('');
      setActionMessage('CSV exported successfully.');
    },
    onError: error => {
      setActionMessage('');
      setActionError(error?.message || 'Unable to export CSV.');
    }
  });

  const summary = data?.stats || {};
  const pendingVendors = vendors.filter(vendor => !vendor.isApproved);
  const approvedVendors = vendors.filter(vendor => vendor.isApproved);
  const recentOrderData = (data?.recentOrders || []).map((order, index) => ({
    name: `#${index + 1}`,
    total: order.total,
    status: order.status
  }));

  const categoryData = (data?.categoryBreakdown || []).map(item => ({
    name: item._id,
    value: item.count
  }));

  const pieColors = ['#22d3ee', '#38bdf8', '#14b8a6', '#a78bfa', '#f472b6', '#f59e0b'];
  const resourceData = [
    { name: 'Students', value: summary.students || 0 },
    { name: 'Vendors', value: summary.vendors || 0 },
    { name: 'Products', value: summary.products || 0 },
    { name: 'Shops', value: summary.shops || 0 }
  ];

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
        <h1 className="text-3xl font-semibold">Admin dashboard</h1>
        <p className="mt-2 text-slate-400">Monitor the campus platform, approve vendor stores, and review marketplace performance.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'vendors', label: 'Vendors' },
            { id: 'shops', label: 'Shops' },
            { id: 'products', label: 'Products' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm transition ${activeTab === tab.id ? 'bg-cyan-400 text-slate-950' : 'border border-white/15 text-slate-200 hover:bg-white/10'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs text-slate-300">
            From
            <input type="date" value={exportRange.from} onChange={e => setExportRange(prev => ({ ...prev, from: e.target.value }))} className="ml-2" />
          </label>
          <label className="text-xs text-slate-300">
            To
            <input type="date" value={exportRange.to} onChange={e => setExportRange(prev => ({ ...prev, to: e.target.value }))} className="ml-2" />
          </label>
          <button
            type="button"
            onClick={() => exportCsvMutation.mutate()}
            disabled={exportCsvMutation.isPending}
            className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-60"
          >
            {exportCsvMutation.isPending ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
        {actionMessage && <p className="mt-4 text-sm text-emerald-300">{actionMessage}</p>}
        {actionError && <p className="mt-4 text-sm text-rose-300">{actionError}</p>}
      </div>
      {activeTab === 'overview' && (
      <>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Students</p>
          <p className="mt-4 text-3xl font-semibold text-slate-100">{summary.students || 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Vendors</p>
          <p className="mt-4 text-3xl font-semibold text-slate-100">{summary.vendors || 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Revenue</p>
          <p className="mt-4 text-3xl font-semibold text-cyan-300">₹{summary.revenue || 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Pending Vendors</p>
          <p className="mt-4 text-3xl font-semibold text-amber-300">{summary.pendingVendors || 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Open Shops</p>
          <p className="mt-4 text-3xl font-semibold text-emerald-300">{summary.openShops || 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Active Products</p>
          <p className="mt-4 text-3xl font-semibold text-indigo-300">{summary.activeProducts || 0}</p>
        </div>
      </div>
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Resource Distribution</h2>
          <p className="text-sm text-slate-400">Live platform counts</p>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={resourceData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
              <Bar dataKey="value" fill="#22d3ee" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
          <h2 className="text-2xl font-semibold">Recent Orders (Revenue)</h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentOrderData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                <Line type="monotone" dataKey="total" stroke="#38bdf8" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
          <h2 className="text-2xl font-semibold">Category Breakdown</h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={100} label>
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      </>
      )}
      {activeTab === 'vendors' && (
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
          <h2 className="text-xl font-semibold">Vendor Approvals</h2>
          <p className="mt-1 text-sm text-slate-400">Pending vendors are shown first. Approved vendors move to Approved list.</p>
          <div className="mt-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Pending ({pendingVendors.length})</h3>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {pendingVendors.map(vendor => (
              <div key={vendor._id} className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                <p className="font-semibold">{vendor.storeName}</p>
                <p className="text-xs text-slate-400">{vendor.user?.email}</p>
                <p className="mt-1 text-xs text-slate-400">Pending approval</p>
                <div className="mt-2 flex gap-2">
                  <button disabled={approveVendorMutation.isPending} onClick={() => approveVendorMutation.mutate(vendor._id)} className="rounded-full border border-emerald-300/40 px-3 py-1 text-xs text-emerald-300 disabled:opacity-50">Approve</button>
                  <button disabled={rejectVendorMutation.isPending} onClick={() => rejectVendorMutation.mutate(vendor._id)} className="rounded-full border border-rose-300/40 px-3 py-1 text-xs text-rose-300 disabled:opacity-50">Reject</button>
                  <button disabled={removeVendorMutation.isPending} onClick={() => removeVendorMutation.mutate(vendor._id)} className="rounded-full border border-red-400/40 px-3 py-1 text-xs text-red-300 disabled:opacity-50">Remove</button>
                </div>
              </div>
            ))}
            {!pendingVendors.length && <p className="text-sm text-slate-400">No pending vendors.</p>}
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Approved ({approvedVendors.length})</h3>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {approvedVendors.map(vendor => (
              <div key={vendor._id} className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                <p className="font-semibold">{vendor.storeName}</p>
                <p className="text-xs text-slate-400">{vendor.user?.email}</p>
                <p className="mt-1 text-xs text-emerald-300">Approved</p>
                <div className="mt-2 flex gap-2">
                  <button disabled={rejectVendorMutation.isPending} onClick={() => rejectVendorMutation.mutate(vendor._id)} className="rounded-full border border-rose-300/40 px-3 py-1 text-xs text-rose-300 disabled:opacity-50">Move to Pending</button>
                  <button disabled={removeVendorMutation.isPending} onClick={() => removeVendorMutation.mutate(vendor._id)} className="rounded-full border border-red-400/40 px-3 py-1 text-xs text-red-300 disabled:opacity-50">Remove Vendor</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {activeTab === 'shops' && (
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
          <h2 className="text-xl font-semibold">Store Controls</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {shops.map(shop => (
              <div key={shop._id} className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                <p className="font-semibold">{shop.name}</p>
                <p className="text-xs text-slate-400">{shop.vendor?.storeName}</p>
                <p className="mt-1 text-xs text-slate-400">{shop.isOpen ? 'Open' : 'Closed'}</p>
                <button disabled={toggleShopMutation.isPending} onClick={() => toggleShopMutation.mutate(shop._id)} className="mt-2 rounded-full border border-cyan-300/40 px-3 py-1 text-xs text-cyan-300 disabled:opacity-50">
                  {shop.isOpen ? 'Close Shop' : 'Open Shop'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      {activeTab === 'products' && (
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
          <h2 className="text-xl font-semibold">Product Controls</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {products.map(product => (
              <div key={product._id} className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                <p className="font-semibold">{product.title}</p>
                <p className="text-xs text-slate-400">{product.shop?.name}</p>
                <p className="mt-1 text-xs text-slate-400">{product.isActive ? 'Active' : 'Inactive'}</p>
                <button disabled={toggleProductMutation.isPending} onClick={() => toggleProductMutation.mutate(product._id)} className="mt-2 rounded-full border border-cyan-300/40 px-3 py-1 text-xs text-cyan-300 disabled:opacity-50">
                  {product.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminDashboardPage;
