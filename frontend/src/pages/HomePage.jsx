import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const fetchTrending = async () => {
  const { data } = await api.get('/products/trending');
  return data.products;
};

const fetchFeaturedShops = async () => {
  const { data } = await api.get('/shops');
  return (data.shops || []).slice(0, 3);
};

const HomePage = () => {
  const { data: trending, isLoading } = useQuery({ queryKey: ['trendingProducts'], queryFn: fetchTrending });
  const { data: featuredShops = [] } = useQuery({ queryKey: ['featuredShops'], queryFn: fetchFeaturedShops });
  const fallbackStoreImage = 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="space-y-8 py-2">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-slate-900/70 shadow-2xl shadow-slate-950/35">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              <span className="font-bold uppercase tracking-[0.35em]">LOBBy</span>
              <span className="text-slate-300">Best Products. Unbeatable Prices. Shop Now!</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Welcome to <span className="text-cyan-300">Lobby</span></h1>
              <p className="max-w-xl text-base leading-7 text-slate-300">Discover campus stores, browse essentials, and order what you need with fast delivery across campus. LOBBy brings snacks, stationery, groceries, and more under one roof.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/shops" className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Stores - Open Now</Link>
              <Link to="/register" className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10">Register</Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/55 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Campus favorites</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Stationery, prints, and fast essentials.</h2>
              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Fast delivery</p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">Delivered in minutes across campus</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Student deals</p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">Daily offers and campus discounts</p>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/55">
              <div className="relative h-64">
                <img
                  src="https://images.unsplash.com/photo-1529473814992-6f5b90b6ec7c?auto=format&fit=crop&w=1200&q=80"
                  alt="Featured store"
                  className="h-full w-full object-cover"
                  onError={e => {
                    e.currentTarget.src = fallbackStoreImage;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <Link to="/shops" className="absolute bottom-4 left-4 rounded-full bg-cyan-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-950 transition hover:bg-cyan-300">Open Now</Link>
              </div>
              <div className="p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Featured store</p>
                <h3 className="mt-4 text-2xl font-semibold text-white">Campus convenience made simple.</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-500">Stores</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Discover popular campus shops</h2>
          </div>
          <Link to="/shops" className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20">See all stores</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {featuredShops.map((shop) => (
            <Link key={shop._id} to={`/shops/${shop._id}`} className="group overflow-hidden rounded-[1.7rem] border border-white/10 bg-slate-900/60 shadow-lg transition hover:-translate-y-1 hover:border-cyan-300/50">
              <div className="relative h-56">
                <img
                  src={shop.bannerImage || fallbackStoreImage}
                  alt={shop.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  onError={e => {
                    e.currentTarget.src = fallbackStoreImage;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-full bg-cyan-400 px-3 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-950">Open Now</div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white">{shop.name}</h3>
                <p className="mt-3 text-slate-300">{shop.description || 'Campus store for daily essentials.'}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-500">Trending</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Popular campus picks</h2>
          </div>
          <Link to="/products" className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20">Browse all products</Link>
        </div>
        {isLoading ? (
          <Loader />
        ) : (
          trending?.length ? (
            <motion.div layout className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {trending.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </motion.div>
          ) : (
            <div className="glass-card p-8 text-slate-200">No trending products yet. Add products or seed demo data.</div>
          )
        )}
      </section>
    </div>
  );
};

export default HomePage;
