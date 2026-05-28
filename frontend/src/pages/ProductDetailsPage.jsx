import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';

const fetchProduct = async ({ queryKey }) => {
  const [, id] = queryKey;
  const { data } = await api.get(`/products/${id}`);
  return data.product;
};

const ProductDetailsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { id } = useParams();
  const { data: product, isLoading, isError } = useQuery({ queryKey: ['product', id], queryFn: fetchProduct, enabled: Boolean(id) });
  const addToCartMutation = useMutation({
    mutationFn: () => api.post('/users/cart', { productId: id, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  if (isLoading) return <Loader />;
  if (isError || !product) return <div className="glass-card p-8 text-slate-200">Product not found or unavailable.</div>;

  const fallbackImage = 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80';
  const image = product.images?.[0] || product.image || fallbackImage;
  const vendorPhone = product.vendor?.contactNumber || product.shop?.contactNumber || '';
  const callablePhone = vendorPhone ? vendorPhone.replace(/\s+/g, '') : '';
  const isUnavailable = product.isAvailable === false;

  return (
    <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
        <img
          src={image}
          alt={product.title}
          className="mb-6 w-full rounded-3xl object-cover"
          onError={e => {
            e.currentTarget.src = fallbackImage;
          }}
        />
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold">{product.title}</h1>
            <span className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">₹{product.price}</span>
          </div>
          {isUnavailable && (
            <p className="rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Unavailable at this moment. You can view details, but ordering is currently disabled.
            </p>
          )}
          <p className="text-slate-400">{product.description}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Category</p>
              <p className="mt-2 text-slate-100">{product.category?.title}</p>
            </div>
            <div className="rounded-3xl bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Stock</p>
              <p className="mt-2 text-slate-100">{product.stock} units</p>
            </div>
          </div>
          {user ? (
            <button
              onClick={() => addToCartMutation.mutate()}
              disabled={addToCartMutation.isPending || isUnavailable}
              className="rounded-3xl bg-cyan-500 px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUnavailable ? 'Unavailable right now' : addToCartMutation.isPending ? 'Adding...' : 'Add to cart'}
            </button>
          ) : (
            <p className="text-sm text-slate-400">Login to add this product to cart.</p>
          )}
          {addToCartMutation.isSuccess && <p className="text-sm text-emerald-300">Added to cart successfully.</p>}
          {addToCartMutation.isError && <p className="text-sm text-rose-300">{addToCartMutation.error?.message || 'Failed to add item to cart.'}</p>}
        </div>
      </div>
      <aside className="space-y-6 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
        <div className="rounded-3xl bg-slate-950 p-6">
          <h2 className="text-xl font-semibold">Vendor</h2>
          <p className="text-slate-400">{product.vendor?.storeName || 'Campus vendor'}</p>
          <p className="mt-2 text-sm text-cyan-300">
            Contact vendor:{' '}
            {vendorPhone ? (
              <a href={`tel:${callablePhone}`} className="underline hover:text-cyan-200">
                {vendorPhone}
              </a>
            ) : 'Not available'}
          </p>
          <p className="mt-3 text-sm text-slate-500">Real-time chat, quick fulfilment, and campus delivery.</p>
        </div>
        <div className="rounded-3xl bg-slate-950 p-6">
          <h2 className="text-xl font-semibold">Why choose LOBBy</h2>
          <ul className="mt-4 space-y-2 text-slate-400">
            <li>• Verified campus vendors</li>
            <li>• Fast delivery within campus</li>
            <li>• Secure payments and chat support</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default ProductDetailsPage;
