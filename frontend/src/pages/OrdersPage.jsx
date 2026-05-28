import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';

const STATUS_LABELS = {
  pending: 'Order received',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  dispatched: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const STATUS_COLORS = {
  pending: 'text-amber-300 border-amber-300/40',
  confirmed: 'text-cyan-300 border-cyan-300/40',
  preparing: 'text-sky-300 border-sky-300/40',
  dispatched: 'text-violet-300 border-violet-300/40',
  delivered: 'text-emerald-300 border-emerald-300/40',
  cancelled: 'text-rose-300 border-rose-300/40'
};

const fetchOrders = async () => {
  const { data } = await api.get('/orders');
  return data.orders;
};

const OrdersPage = () => {
  const { data: orders = [], isLoading, isError, error } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    refetchOnWindowFocus: true
  });

  if (isLoading) return <Loader />;
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="theme-panel">
          <h1 className="text-3xl font-semibold">My orders</h1>
          <p className="text-slate-400">Track your order timeline, delivery status, and vendor updates.</p>
        </div>
        <div className="rounded-3xl border border-rose-300/30 bg-rose-400/10 p-6 text-rose-200">
          {error?.message || 'Unable to load orders right now.'} Please login again.
          <Link to="/login" className="ml-2 underline">Go to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="theme-panel">
        <h1 className="text-3xl font-semibold">My orders</h1>
        <p className="text-slate-400">Track your order timeline, delivery status, and vendor updates.</p>
      </div>
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="theme-panel text-center text-slate-400">No orders yet. Explore campus products and place your first order.</div>
        ) : orders.map(order => (
          <div key={order._id} className="theme-subcard">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">Order #{order._id.slice(-6)}</p>
                <span className={`mt-1 inline-block rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.status] || 'text-slate-300 border-slate-500/40'}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              <p className="font-semibold text-cyan-300">₹{order.total}</p>
            </div>
            {order.deliveryPartner && order.status === 'dispatched' && (
              <p className="mt-2 text-sm text-slate-400">Delivery partner: {order.deliveryPartner.name}</p>
            )}
            {order.status === 'dispatched' && (order.deliveryOtp || order.customerDeliveryOtp) && (
              <div className="mt-4 rounded-2xl border border-cyan-300/40 bg-cyan-400/10 p-4">
                <p className="text-sm font-medium text-cyan-100">Your delivery OTP</p>
                <p className="mt-2 text-3xl font-bold tracking-[0.35em] text-cyan-300">{order.deliveryOtp || order.customerDeliveryOtp}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Share this code with the delivery partner only when you receive your order. Vendors and riders do not see this code in their dashboards.
                </p>
              </div>
            )}
            {order.deliveredAt && (
              <p className="mt-1 text-xs text-emerald-300">Delivered on {new Date(order.deliveredAt).toLocaleString()}</p>
            )}
            {order.tracking?.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-slate-700 pt-4">
                {order.tracking.map((entry, index) => (
                  <li key={`${entry.updatedAt}-${index}`} className="flex gap-3 text-sm text-slate-400">
                    <span className="text-slate-500">{new Date(entry.updatedAt).toLocaleString()}</span>
                    <span>{entry.note || STATUS_LABELS[entry.status] || entry.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
