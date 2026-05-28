import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const fetchProducts = async ({ queryKey }) => {
  const [, params] = queryKey;
  const query = new URLSearchParams(params).toString();
  const { data } = await api.get(`/products?${query}`);
  return data;
};

const ProductListingPage = () => {
  const [searchParams] = useSearchParams();
  const searchText = searchParams.get('q') || '';
  const [filters, setFilters] = useState({ page: 1, limit: 12 });
  const queryFilters = useMemo(
    () => ({
      ...filters,
      ...(searchText ? { search: searchText } : {})
    }),
    [filters, searchText]
  );
  const { data, isLoading } = useQuery({ queryKey: ['products', queryFilters], queryFn: fetchProducts, keepPreviousData: true });

  return (
    <div className="space-y-8">
      <div className="glass-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Explore campus products</h1>
            <p className="text-slate-300">Search across categories, trending stores, and student-approved items.</p>
            {searchText && <p className="mt-2 text-sm text-cyan-300">Showing results for "{searchText}"</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setFilters({ ...filters, sort: 'rating' })} className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-slate-100 hover:bg-white/20">Top rated</button>
            <button onClick={() => setFilters({ ...filters, sort: 'price' })} className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-slate-100 hover:bg-white/20">Price low</button>
          </div>
        </div>
      </div>
      {isLoading ? <Loader /> : (
        data?.products?.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data.products.map(product => <ProductCard key={product._id} product={product} />)}
          </div>
        ) : (
          <div className="glass-card p-8 text-slate-200">No products found yet. Add products from vendor/admin panel or run seed data.</div>
        )
      )}
    </div>
  );
};

export default ProductListingPage;
