import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const ProfilePage = () => {
  const { user } = useAuth();
  const [address, setAddress] = useState({ label: '', street: '', city: '', state: '', zipcode: '', phone: '' });

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-glass">
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="mt-2 text-slate-400">Manage your account, shipping addresses, and campus preferences.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-slate-950 p-6">
            <h2 className="text-xl font-semibold">Student info</h2>
            <p className="mt-4 text-slate-300">Name: {user?.name}</p>
            <p className="text-slate-300">Email: {user?.email}</p>
            <p className="text-slate-300">Phone: {user?.phone || 'Not added'}</p>
            <p className="text-slate-300">Role: {user?.role}</p>
          </div>
          <div className="rounded-3xl bg-slate-950 p-6">
            <h2 className="text-xl font-semibold">Add address</h2>
            <div className="mt-4 grid gap-3">
              <input value={address.label} onChange={e => setAddress({ ...address, label: e.target.value })} className="w-full border-slate-700 bg-slate-900 p-3" placeholder="Home" />
              <input value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} className="w-full border-slate-700 bg-slate-900 p-3" placeholder="Street" />
              <div className="grid gap-3 md:grid-cols-2"><input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} className="w-full border-slate-700 bg-slate-900 p-3" placeholder="City" /><input value={address.zipcode} onChange={e => setAddress({ ...address, zipcode: e.target.value })} className="w-full border-slate-700 bg-slate-900 p-3" placeholder="Zipcode" /></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
