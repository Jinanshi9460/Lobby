import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Loader from '../components/Loader';
import ProductCard from '../components/ProductCard';

const fetchShop = async (shopId) => {
  const { data } = await api.get(`/shops/${shopId}`);
  return data.shop;
};

const fetchShopProducts = async (shopId) => {
  const { data } = await api.get(`/shops/${shopId}/products`);
  return data.products;
};

const ShopDetailsPage = () => {
  const { id } = useParams();
  const { data: shop, isLoading: shopLoading, isError: shopError } = useQuery({ queryKey: ['shop', id], queryFn: () => fetchShop(id), enabled: Boolean(id) });
  const { data: products, isLoading: productsLoading } = useQuery({ queryKey: ['shopProducts', id], queryFn: () => fetchShopProducts(id), enabled: Boolean(id) });

  if (shopLoading) return <Loader />;
  if (shopError || !shop) return <div className="glass-card p-8 text-slate-200">Shop not found or unavailable.</div>;
  const vendorPhone = shop.contactNumber || shop.vendor?.contactNumber || '';
  const callablePhone = vendorPhone ? vendorPhone.replace(/\s+/g, '') : '';

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/60 shadow-lg">
        <div className="relative h-72">
          <img
            src={shop.bannerImage || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'}
            alt={shop.name}
            className="h-full w-full object-cover"
            onError={e => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          <div className="absolute inset-0 bg-slate-950/50" />
          <div className="absolute bottom-6 left-6 text-white">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">{shop.campus}</p>
            <h1 className="mt-2 text-4xl font-semibold">{shop.name}</h1>
            {!shop.isOpen && (
              <p className="mt-3 inline-flex rounded-full border border-amber-300/50 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200">
                Unavailable at this moment
              </p>
            )}
          </div>
        </div>
        <div className="p-8">
          <div className="mb-6 grid gap-4 md:grid-cols-[2fr_1fr]">
            <div>
              <p className="text-lg text-slate-200">{shop.description || 'No description available.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {shop.tags?.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-slate-300">{tag}</span>
                ))}
              </div>
            </div>
            <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
              <div className="text-sm text-slate-400">Location</div>
              <div className="text-slate-100">{shop.address}</div>
              <div className="text-sm text-slate-400">Vendor</div>
              <div className="text-slate-100">{shop.vendor?.storeName || 'Campus vendor'}</div>
              <div className="text-sm text-slate-400">Contact vendor</div>
              <div className="text-cyan-300">
                {vendorPhone ? (
                  <a href={`tel:${callablePhone}`} className="underline hover:text-cyan-200">
                    {vendorPhone}
                  </a>
                ) : 'Not available'}
              </div>
              <div className="text-sm text-slate-400">Rating</div>
              <div className="text-slate-100">{shop.rating?.toFixed(1) || '4.0'} ★</div>
              <Link to="/shops" className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Back to shops</Link>
            </div>
          </div>

          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-500">Shop products</p>
                <h2 className="text-2xl font-semibold text-white">What this shop offers</h2>
              </div>
            </div>
            {productsLoading ? (
              <Loader />
            ) : products?.length ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/15 bg-white/5 p-8 text-slate-300">No products found for this shop yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDetailsPage;
