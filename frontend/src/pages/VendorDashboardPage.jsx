import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';

const fetchAnalytics = async () => {
  const { data } = await api.get('/vendors/analytics');
  return data;
};

const fetchVendorProducts = async () => {
  const { data } = await api.get('/vendors/products');
  return data.products;
};

const fetchCategories = async () => {
  const { data } = await api.get('/products/categories');
  return data.categories;
};

const fetchVendorProfile = async () => {
  const { data } = await api.get('/vendors/me');
  return data.vendor;
};

const fileToDataUrl = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const VendorDashboardPage = () => {
  const queryClient = useQueryClient();
  const [exportRange, setExportRange] = useState({ from: '', to: '' });
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    image: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const { data, isLoading, isError: analyticsError, error: analyticsErrorData } = useQuery({ queryKey: ['vendorAnalytics'], queryFn: fetchAnalytics });
  const { data: vendorProfile, isError: profileError, error: profileErrorData } = useQuery({ queryKey: ['vendorProfile'], queryFn: fetchVendorProfile });
  const { data: products = [] } = useQuery({ queryKey: ['vendorProducts'], queryFn: fetchVendorProducts });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const createProductMutation = useMutation({
    mutationFn: payload => api.post('/vendors/products', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['trendingProducts'] });
      setForm({ title: '', description: '', category: categories[0]?._id || '', price: '', stock: '', image: '' });
      setImageFile(null);
    }
  });
  const deleteProductMutation = useMutation({
    mutationFn: id => api.delete(`/vendors/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['trendingProducts'] });
    }
  });
  const exportCsvMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (exportRange.from) params.set('from', exportRange.from);
      if (exportRange.to) params.set('to', exportRange.to);
      const query = params.toString();
      const response = await api.get(`/vendors/export/csv${query ? `?${query}` : ''}`, {
        responseType: 'blob'
      });
      return response.data;
    }
  });
  const chartData = [
    { day: 'Mon', revenue: 3200 },
    { day: 'Tue', revenue: 4500 },
    { day: 'Wed', revenue: 3800 },
    { day: 'Thu', revenue: 5400 },
    { day: 'Fri', revenue: 6100 }
  ];

  const handleCreateProduct = async () => {
    let imageSource = form.image?.trim();
    if (imageFile) {
      imageSource = await fileToDataUrl(imageFile);
    }

    createProductMutation.mutate({
      title: form.title,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      images: imageSource ? [imageSource] : []
    });
  };

  if (isLoading) return <Loader />;
  if (analyticsError || profileError) {
    const message = analyticsErrorData?.message || profileErrorData?.message || 'Unable to load vendor dashboard.';
    return (
      <div className="glass-card p-8 text-slate-200">
        <p className="text-lg font-semibold text-amber-300">Admin approval pending</p>
        <p className="mt-2">{message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
        <h1 className="text-3xl font-semibold">Vendor dashboard</h1>
        <p className="mt-2 text-slate-400">Monitor orders, inventory value, and sales performance from campus shoppers.</p>
        <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <p>Store: <span className="font-semibold text-slate-100">{vendorProfile?.storeName || 'N/A'}</span></p>
          <p>Phone: <span className="font-semibold text-slate-100">{vendorProfile?.contactNumber || vendorProfile?.user?.phone || 'Not added'}</span></p>
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
            onClick={() => {
              exportCsvMutation.mutate(undefined, {
                onSuccess: blob => {
                  const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `vendor-report-${Date.now()}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                }
              });
            }}
            disabled={exportCsvMutation.isPending}
            className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-60"
          >
            {exportCsvMutation.isPending ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Revenue</p>
          <p className="mt-4 text-3xl font-semibold text-cyan-300">₹{data.vendorSummary?.revenue ?? '0'}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Orders</p>
          <p className="mt-4 text-3xl font-semibold text-slate-300">{data.vendorSummary?.totalOrders ?? '0'}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Inventory value</p>
          <p className="mt-4 text-3xl font-semibold text-slate-300">₹{data.vendorSummary?.inventoryValue ?? '0'}</p>
        </div>
      </div>
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
        <h2 className="text-2xl font-semibold">Weekly revenue</h2>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
              <Area type="monotone" dataKey="revenue" stroke="#22d3ee" fill="#0891b2" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
          <h2 className="text-2xl font-semibold">Your products</h2>
          <div className="mt-4 space-y-3">
            {!products.length ? (
              <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-slate-400">No products yet. Add your first product.</div>
            ) : products.map(product => (
              <div key={product._id} className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-950 p-4">
                <div>
                  <p className="font-semibold">{product.title}</p>
                  <p className="text-sm text-slate-400">{product.category?.title} | ₹{product.price}</p>
                </div>
                <button onClick={() => deleteProductMutation.mutate(product._id)} className="rounded-full border border-rose-400/40 px-4 py-2 text-sm text-rose-300">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
          <h2 className="text-2xl font-semibold">Add new product</h2>
          <div className="mt-4 space-y-3">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border-slate-700 bg-slate-950 p-3" placeholder="Product title" />
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border-slate-700 bg-slate-950 p-3" placeholder="Description" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border-slate-700 bg-slate-950 p-3">
              <option value="">Select category</option>
              {categories.map(category => <option key={category._id} value={category._id}>{category.title}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full border-slate-700 bg-slate-950 p-3" placeholder="Price" />
              <input value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="w-full border-slate-700 bg-slate-950 p-3" placeholder="Stock" />
            </div>
            <input
              value={form.image}
              onChange={e => setForm({ ...form, image: e.target.value })}
              className="w-full border-slate-700 bg-slate-950 p-3"
              placeholder="Image URL (optional)"
              disabled={Boolean(imageFile)}
            />
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
              <p className="mb-2 text-xs text-slate-400">Or upload an image file</p>
              <input
                type="file"
                accept="image/*"
                onChange={e => setImageFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-3 file:py-2 file:text-slate-950"
              />
              {imageFile && <p className="mt-2 text-xs text-emerald-300">Selected: {imageFile.name}</p>}
            </div>
            <button
              onClick={handleCreateProduct}
              disabled={createProductMutation.isPending}
              className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
            >
              {createProductMutation.isPending ? 'Adding...' : 'Add product'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VendorDashboardPage;
