import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const loadRazorpayScript = () => new Promise(resolve => {
  if (window.Razorpay) {
    resolve(true);
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const fetchCart = async () => {
  const { data } = await api.get('/users/cart');
  return data.cart || [];
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: cart = [], isLoading } = useQuery({ queryKey: ['cart'], queryFn: fetchCart });
  const [address, setAddress] = useState({ label: 'Hostel', street: '', city: '', state: '', zipcode: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0),
    [cart]
  );
  const unavailableItems = cart.filter(item => {
    const product = item.product;
    return !product?.isActive || !product?.shop?.isOpen || !product?.vendor?.isApproved;
  });

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        items: cart.map(item => ({ product: item.product._id, quantity: item.quantity })),
        shippingAddress: address,
        paymentMethod
      };
      if (paymentMethod === 'razorpay') {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Unable to load Razorpay checkout. Check your internet and try again.');
        }
        const response = await api.post('/orders', payload);
        const { order, razorpayOrder } = response.data;
        if (!razorpayOrder?.id) {
          throw new Error('Razorpay order creation failed.');
        }
        const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
        if (!key) {
          throw new Error('Razorpay key is missing in frontend env.');
        }
        await new Promise((resolve, reject) => {
          const razorpayInstance = new window.Razorpay({
            key,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: 'LOBBy',
            description: `Order #${order._id}`,
            order_id: razorpayOrder.id,
            handler: async paymentResponse => {
              try {
                await api.post('/orders/verify-payment', {
                  ...paymentResponse,
                  orderId: order._id
                });
                await api.delete('/users/cart');
                resolve(true);
              } catch (error) {
                reject(new Error(error?.message || 'Payment verification failed'));
              }
            },
            prefill: {
              name: address.label || '',
              contact: address.phone || ''
            },
            theme: { color: '#06b6d4' },
            modal: {
              ondismiss: () => reject(new Error('Payment cancelled'))
            }
          });
          razorpayInstance.open();
        });
        return { success: true };
      }

      const response = await api.post('/orders', payload);
      await api.delete('/users/cart');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate('/orders');
    }
  });

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-glass">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Checkout</h1>
          <p className="mt-2 text-slate-400">Complete your order with secure payment and campus delivery details.</p>
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl bg-slate-950 p-6">
          <h2 className="mb-4 text-xl font-semibold">Shipping address</h2>
          <form className="space-y-4">
            <input value={address.street} onChange={e => setAddress(prev => ({ ...prev, street: e.target.value }))} className="w-full border-slate-700 bg-slate-900 p-4" placeholder="Street address" />
            <div className="grid gap-4 md:grid-cols-2">
              <input value={address.city} onChange={e => setAddress(prev => ({ ...prev, city: e.target.value }))} className="w-full border-slate-700 bg-slate-900 p-4" placeholder="City" />
              <input value={address.state} onChange={e => setAddress(prev => ({ ...prev, state: e.target.value }))} className="w-full border-slate-700 bg-slate-900 p-4" placeholder="State" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={address.zipcode} onChange={e => setAddress(prev => ({ ...prev, zipcode: e.target.value }))} className="w-full border-slate-700 bg-slate-900 p-4" placeholder="Zipcode" />
              <input value={address.phone} onChange={e => setAddress(prev => ({ ...prev, phone: e.target.value }))} className="w-full border-slate-700 bg-slate-900 p-4" placeholder="Phone" />
            </div>
          </form>
        </section>
        <aside className="rounded-3xl bg-slate-950 p-6">
          <h2 className="text-xl font-semibold">Payment</h2>
          <div className="mt-4 space-y-4">
            <button type="button" onClick={() => setPaymentMethod('cod')} className={`w-full rounded-3xl border p-4 text-left ${paymentMethod === 'cod' ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-700 bg-slate-900'}`}>Cash on delivery</button>
            <button type="button" onClick={() => setPaymentMethod('razorpay')} className={`w-full rounded-3xl border p-4 text-left ${paymentMethod === 'razorpay' ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-700 bg-slate-900'}`}>Pay with Razorpay</button>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
            {isLoading ? 'Loading cart...' : `Items: ${cart.length} | Total: ₹${total.toFixed(0)}`}
          </div>
          <button
            onClick={() => placeOrderMutation.mutate()}
            disabled={!cart.length || unavailableItems.length > 0 || placeOrderMutation.isPending}
            className="mt-6 w-full rounded-3xl bg-cyan-500 px-5 py-4 text-base font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placeOrderMutation.isPending ? 'Placing order...' : 'Place order'}
          </button>
          {unavailableItems.length > 0 && (
            <p className="mt-3 text-sm text-amber-300">
              Some items are unavailable at this moment. Remove them from cart to place order.
            </p>
          )}
          {placeOrderMutation.isError && <p className="mt-3 text-sm text-rose-300">{placeOrderMutation.error?.message || 'Failed to place order'}</p>}
        </aside>
      </div>
    </div>
  );
};

export default CheckoutPage;
