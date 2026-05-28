import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const fallbackImage = 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80';
  const image = product.images?.[0] || product.image || fallbackImage;
  const isUnavailable = product.isAvailable === false;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/65 p-4 shadow-2xl shadow-slate-950/30 transition hover:-translate-y-1 hover:border-cyan-300/70">
      {isUnavailable && (
        <div className="absolute left-4 top-4 z-10 rounded-full border border-amber-300/50 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200">
          Unavailable at this moment
        </div>
      )}
      <div className="mb-4 h-48 overflow-hidden rounded-3xl bg-slate-800">
        <img
          src={image}
          alt={product.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={e => {
            e.currentTarget.src = fallbackImage;
          }}
        />
      </div>
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.25em] text-cyan-500">{product.category?.title || 'Campus'}</div>
        <h3 className="text-lg font-semibold text-slate-100">{product.title}</h3>
        <p className="line-clamp-2 text-sm text-slate-400">{product.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">₹{product.price}</p>
            {product.discount > 0 && <p className="text-xs text-cyan-300">{product.discount}% off</p>}
          </div>
          <Link to={`/products/${product._id}`} className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">View</Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
