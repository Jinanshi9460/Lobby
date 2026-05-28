import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const fetchCart = async () => {
  const { data } = await api.get('/users/cart');
  return data.cart || [];
};

const CartPage = () => {
  const queryClient = useQueryClient();
  const { data: cart = [], isLoading } = useQuery({ queryKey: ['cart'], queryFn: fetchCart });

  const updateQtyMutation = useMutation({
    mutationFn: ({ productId, quantity }) => api.put(`/users/cart/${productId}`, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] })
  });
  const removeMutation = useMutation({
    mutationFn: productId => api.delete(`/users/cart/${productId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] })
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const discount = cart.reduce((sum, item) => {
    const price = item.product?.price || 0;
    const pct = item.product?.discount || 0;
    return sum + ((price * pct) / 100) * item.quantity;
  }, 0);
  const total = Math.max(0, subtotal - discount);

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-glass">
      <h1 className="text-3xl font-semibold">Your cart</h1>
      <p className="mt-2 text-slate-400">Review items and proceed to secure checkout.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl bg-slate-950 p-6">
          {isLoading ? (
            <div className="rounded-3xl border border-slate-800 p-5 text-slate-400">Loading cart...</div>
          ) : cart.length ? cart.map(({ product, quantity }) => (
            <div key={product?._id} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-800 p-5">
              <div className="flex items-center gap-4">
                <img src={product?.images?.[0]} alt={product?.title} className="h-16 w-16 rounded-2xl object-cover" />
                <div>
                  <p className="font-semibold">{product?.title}</p>
                  <p className="text-sm text-slate-400">{product?.category?.title || 'Campus'}</p>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <p className="text-lg font-semibold">₹{product?.price}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQtyMutation.mutate({ productId: product._id, quantity: Math.max(1, quantity - 1) })} className="h-8 w-8 rounded-full border border-slate-700">-</button>
                  <span className="min-w-8 text-center text-sm text-slate-300">{quantity}</span>
                  <button onClick={() => updateQtyMutation.mutate({ productId: product._id, quantity: quantity + 1 })} className="h-8 w-8 rounded-full border border-slate-700">+</button>
                  <button onClick={() => removeMutation.mutate(product._id)} className="ml-2 rounded-full border border-rose-400/40 px-3 py-1 text-xs text-rose-300">Remove</button>
                </div>
              </div>
            </div>
          )) : (
            <div className="rounded-3xl border border-slate-800 p-5 text-slate-400">No items in your cart yet. Add campus essentials from the shop.</div>
          )}
        </div>
        <aside className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-semibold">Order summary</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-₹{discount.toFixed(0)}</span></div>
            <div className="flex justify-between"><span className="font-semibold">Total</span><span className="font-semibold">₹{total.toFixed(0)}</span></div>
          </div>
          <Link to="/checkout" className={`mt-6 block w-full rounded-3xl px-5 py-4 text-center text-base font-semibold ${cart.length ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'cursor-not-allowed bg-slate-800 text-slate-500'}`}>
            Proceed to checkout
          </Link>
        </aside>
      </div>
    </div>
  );
};

export default CartPage;
