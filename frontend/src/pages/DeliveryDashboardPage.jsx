import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Loader from '../components/Loader';

const fetchAssignedOrders = async () => {
  const { data } = await api.get('/delivery/orders');
  return data;
};

const DeliveryDashboardPage = () => {
  const queryClient = useQueryClient();
  const [otpByOrder, setOtpByOrder] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['deliveryOrders'], queryFn: fetchAssignedOrders });

  const confirmMutation = useMutation({
    mutationFn: ({ orderId, otp }) => api.post(`/delivery/orders/${orderId}/confirm`, { otp }),
    onSuccess: () => {
      setError('');
      setMessage('Delivery confirmed successfully.');
      queryClient.invalidateQueries({ queryKey: ['deliveryOrders'] });
    },
    onError: err => {
      setMessage('');
      setError(err.message || 'Invalid OTP or confirmation failed');
    }
  });

  if (isLoading) return <Loader />;

  const orders = data?.orders || [];

  return (
    <div className="space-y-6">
      <div className="theme-panel">
        <h1 className="text-3xl font-semibold">Delivery dashboard</h1>
        <p className="mt-2 text-slate-400">
          Welcome{data?.partner?.name ? `, ${data.partner.name}` : ''}. Ask the customer for their delivery OTP and enter it below after handoff.
        </p>
      </div>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-rose-300">{error}</p>}

      {!orders.length ? (
        <div className="theme-panel text-slate-400">No active deliveries. Assigned orders appear here when dispatched.</div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="theme-subcard">
              <p className="font-semibold">Order #{order._id.slice(-6)}</p>
              <p className="text-sm text-slate-400">₹{order.total}</p>
              <p className="text-sm text-slate-400">
                Deliver to: {order.shippingAddress?.street}, {order.shippingAddress?.city}
              </p>
              <p className="text-sm text-slate-400">Customer: {order.user?.name} · {order.user?.phone || '—'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpByOrder[order._id] || ''}
                  onChange={e => setOtpByOrder(prev => ({ ...prev, [order._id]: e.target.value }))}
                  className="theme-field ml-0 w-32"
                  placeholder="6-digit OTP"
                />
                <button
                  type="button"
                  disabled={confirmMutation.isPending}
                  onClick={() => confirmMutation.mutate({ orderId: order._id, otp: otpByOrder[order._id] })}
                  className="theme-action"
                >
                  Confirm delivery
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboardPage;
