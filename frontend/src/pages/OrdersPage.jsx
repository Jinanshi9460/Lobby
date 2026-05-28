import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';

const fetchOrders = async () => {
  const { data } = await api.get('/orders');
  return data.orders;
};

const OrdersPage = () => {
  const { data: orders = [], isLoading, isError, error } = useQuery({ queryKey: ['orders'], queryFn: fetchOrders });

  if (isLoading) return <Loader />;
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
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
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
        <h1 className="text-3xl font-semibold">My orders</h1>
        <p className="text-slate-400">Track your order timeline, delivery status, and vendor updates.</p>
      </div>
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">No orders yet. Explore campus products and place your first order.</div>
        ) : orders.map(order => (
          <div key={order._id} className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">Order #{order._id.slice(-6)}</p>
                <p className="text-sm text-slate-400">{order.status.toUpperCase()}</p>
              </div>
              <p className="font-semibold text-cyan-300">₹{order.total}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
