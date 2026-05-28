import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const STATUS_LABELS = {
  pending: 'Order received',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  dispatched: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const fetchOrders = async () => {
  const { data } = await api.get('/orders');
  return data.orders || [];
};

const fetchPartners = async () => {
  const { data } = await api.get('/vendors/delivery-partners');
  return data.partners || [];
};

const VendorOrdersPanel = () => {
  const queryClient = useQueryClient();
  const [dispatchPartnerId, setDispatchPartnerId] = useState({});
  const [partnerForm, setPartnerForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: orders = [], isLoading: ordersLoading } = useQuery({ queryKey: ['vendorOrders'], queryFn: fetchOrders });
  const { data: partners = [] } = useQuery({ queryKey: ['deliveryPartners'], queryFn: fetchPartners });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
    queryClient.invalidateQueries({ queryKey: ['deliveryPartners'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      setError('');
      setMessage('Order status updated.');
      invalidate();
    },
    onError: err => {
      setMessage('');
      setError(err.message || 'Failed to update status');
    }
  });

  const dispatchMutation = useMutation({
    mutationFn: ({ id, deliveryPartnerId }) => api.post(`/orders/${id}/dispatch`, { deliveryPartnerId }),
    onSuccess: () => {
      setError('');
      setMessage('Order dispatched. The customer received the delivery OTP — partner must collect it on handoff.');
      invalidate();
    },
    onError: err => {
      setMessage('');
      setError(err.message || 'Failed to dispatch order');
    }
  });

  const createPartnerMutation = useMutation({
    mutationFn: payload => api.post('/vendors/delivery-partners', payload),
    onSuccess: () => {
      setError('');
      setMessage('Delivery partner created.');
      setPartnerForm({ name: '', email: '', phone: '', password: '' });
      invalidate();
    },
    onError: err => {
      setMessage('');
      setError(err.message || 'Failed to create partner');
    }
  });

  const togglePartnerMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.put(`/vendors/delivery-partners/${id}`, { isActive }),
    onSuccess: () => {
      setError('');
      setMessage('Partner updated.');
      invalidate();
    },
    onError: err => {
      setMessage('');
      setError(err.message || 'Failed to update partner');
    }
  });

  const activePartners = partners.filter(p => p.isActive);

  return (
    <div className="space-y-6">
      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
        <h2 className="text-2xl font-semibold">Store orders</h2>
        <p className="mt-1 text-sm text-slate-400">Prepare, dispatch with a partner, and track delivery. Customers receive the OTP — not shown here.</p>
        {ordersLoading ? (
          <p className="mt-4 text-slate-400">Loading orders...</p>
        ) : !orders.length ? (
          <p className="mt-4 text-slate-400">No orders yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map(order => (
              <div key={order._id} className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">Order #{order._id.slice(-6)}</p>
                    <p className="text-sm text-slate-400">₹{order.total} · {STATUS_LABELS[order.status] || order.status}</p>
                    {order.deliveryPartner && (
                      <p className="text-xs text-cyan-300">Partner: {order.deliveryPartner.name}</p>
                    )}
                  </div>
                  <span className="rounded-full border border-slate-600 px-3 py-1 text-xs uppercase text-slate-300">{order.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {order.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate({ id: order._id, status: 'preparing' })}
                      className="theme-chip-btn border-cyan-300/40 text-cyan-300"
                    >
                      Start preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <>
                      <select
                        value={dispatchPartnerId[order._id] || ''}
                        onChange={e => setDispatchPartnerId(prev => ({ ...prev, [order._id]: e.target.value }))}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200"
                      >
                        <option value="">Assign partner</option>
                        {activePartners.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!dispatchPartnerId[order._id] || dispatchMutation.isPending}
                        onClick={() => dispatchMutation.mutate({ id: order._id, deliveryPartnerId: dispatchPartnerId[order._id] })}
                        className="theme-chip-btn border-emerald-300/40 text-emerald-300"
                      >
                        Dispatch
                      </button>
                    </>
                  )}
                  {['confirmed', 'preparing'].includes(order.status) && (
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate({ id: order._id, status: 'cancelled' })}
                      className="theme-chip-btn border-rose-300/40 text-rose-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
        <h2 className="text-2xl font-semibold">Delivery partners</h2>
        <p className="mt-1 text-sm text-slate-400">Create accounts for riders linked to your store.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {partners.map(partner => (
            <div key={partner._id} className="rounded-xl border border-slate-700 bg-slate-950 p-3">
              <p className="font-semibold">{partner.name}</p>
              <p className="text-xs text-slate-400">{partner.user?.email}</p>
              <p className="text-xs text-slate-400">{partner.phone || 'No phone'}</p>
              <button
                type="button"
                onClick={() => togglePartnerMutation.mutate({ id: partner._id, isActive: !partner.isActive })}
                className="theme-chip-btn mt-2 border-slate-500/40 text-slate-300"
              >
                {partner.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-3 border-t border-slate-700 pt-6">
          <h3 className="font-semibold">Add partner</h3>
          <input value={partnerForm.name} onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })} className="w-full border-slate-700 bg-slate-950 p-3" placeholder="Full name" />
          <input value={partnerForm.email} onChange={e => setPartnerForm({ ...partnerForm, email: e.target.value })} className="w-full border-slate-700 bg-slate-950 p-3" placeholder="Email" type="email" />
          <input value={partnerForm.phone} onChange={e => setPartnerForm({ ...partnerForm, phone: e.target.value })} className="w-full border-slate-700 bg-slate-950 p-3" placeholder="Phone" />
          <input value={partnerForm.password} onChange={e => setPartnerForm({ ...partnerForm, password: e.target.value })} className="w-full border-slate-700 bg-slate-950 p-3" placeholder="Password (min 8 chars)" type="password" />
          <button
            type="button"
            onClick={() => createPartnerMutation.mutate(partnerForm)}
            disabled={createPartnerMutation.isPending}
            className="rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
          >
            {createPartnerMutation.isPending ? 'Creating...' : 'Create delivery partner'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default VendorOrdersPanel;
