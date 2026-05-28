import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Loader from '../components/Loader';

const fetchNotifications = async () => {
  const { data } = await api.get('/notifications');
  return data.notifications;
};

const NotificationsPage = () => {
  const { data: notifications, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications });

  if (isLoading) return <Loader />;

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-glass">
      <h1 className="text-3xl font-semibold">Notifications</h1>
      <div className="mt-6 space-y-4">
        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">No notifications yet. You’ll receive alerts here once your orders update.</div>
        ) : notifications.map(item => (
          <div key={item._id} className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
            <p className="font-semibold text-slate-100">{item.title}</p>
            <p className="mt-1 text-slate-400">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
