import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Loader from '../components/Loader';

const fetchShops = async () => {
  const { data } = await api.get('/shops');
  return data.shops;
};

const ShopListingPage = () => {
  const { data: shops, isLoading, isError } = useQuery({ queryKey: ['shops'], queryFn: fetchShops });

  return (
    <div className="space-y-8">
      <div className="glass-card p-6">
        <h1 className="text-3xl font-semibold text-white">Campus Shops</h1>
        <p className="mt-2 text-slate-300">Browse vendor stores, compare shop offers, and discover campus favorites.</p>
      </div>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <div className="glass-card p-8 text-slate-200">Unable to load shops right now. Please try again.</div>
      ) : !shops?.length ? (
        <div className="glass-card p-8 text-slate-200">No shops available yet.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {shops?.map((shop) => (
            <Link key={shop._id} to={`/shops/${shop._id}`} className="group overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/60 shadow-lg transition hover:-translate-y-1 hover:border-cyan-300/50">
              <div className="relative h-56">
                <img
                  src={shop.bannerImage || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'}
                  alt={shop.name}
                  className="h-full w-full object-cover"
                  onError={e => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-cyan-100">{shop.campus}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{shop.name}</h2>
                  {!shop.isOpen && (
                    <span className="mt-2 inline-flex rounded-full border border-amber-300/50 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200">
                      Unavailable at this moment
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-4 p-6">
                <p className="line-clamp-3 text-slate-300">{shop.description || 'No description available.'}</p>
                <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                  {shop.tags?.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>{shop.address || 'Campus location'}</span>
                  <span>{shop.rating?.toFixed(1) || '4.0'} ★</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopListingPage;
