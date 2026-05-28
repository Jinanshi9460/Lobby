import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FaBars, FaShoppingCart, FaUserCircle } from 'react-icons/fa';
import BrandLogo from './BrandLogo';

const NavItem = ({ to, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `rounded-full px-5 py-3 text-sm font-medium transition ${
      isActive ? 'bg-cyan-400 text-slate-950' : 'text-slate-200 hover:bg-white/10'
    }`}
  >
    {children}
  </NavLink>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMenu, setAuthMenu] = useState(null);
  const navigate = useNavigate();

  const onSearch = e => {
    e.preventDefault();
    const query = search.trim();
    navigate(query ? `/products?q=${encodeURIComponent(query)}` : '/products');
    setMenuOpen(false);
  };

  const onLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-8">
        <div className="flex items-center gap-4">
          <BrandLogo
            to={user?.role === 'admin' ? '/admin' : user?.role === 'vendor' ? '/vendor' : '/customer'}
          />
          <nav className="hidden items-center gap-2 md:flex">
            {user?.role === 'admin' ? (
              <>
                <NavItem to="/admin">Admin Dashboard</NavItem>
                <NavItem to="/admin/settings">Settings</NavItem>
                <NavItem to="/helpdesk">Helpdesk</NavItem>
              </>
            ) : user?.role === 'vendor' ? (
              <>
                <NavItem to="/vendor">Vendor Dashboard</NavItem>
                <NavItem to="/vendor/settings">Settings</NavItem>
                <NavItem to="/helpdesk">Helpdesk</NavItem>
              </>
            ) : (
              <>
                <NavItem to="/customer">Customer Home</NavItem>
                <NavItem to="/products">Products</NavItem>
                <NavItem to="/shops">Shops</NavItem>
                <NavItem to="/settings">Settings</NavItem>
                <NavItem to="/helpdesk">Helpdesk</NavItem>
                {user?.role === 'student' && <NavItem to="/orders">Orders</NavItem>}
              </>
            )}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {user?.role !== 'vendor' && <form onSubmit={onSearch} className="hidden w-full max-w-sm lg:block xl:max-w-md">
            <div className="relative rounded-full border border-white/15 bg-slate-900/70 px-4 py-2 shadow-sm">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full border-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400"
                placeholder="Search products, shops, services"
              />
            </div>
          </form>}
          <div className="hidden items-center gap-2 whitespace-nowrap md:flex">
            {user?.role !== 'vendor' && <Link to="/cart" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10">
              <FaShoppingCart /> Cart
            </Link>}
            {!user && (
              <>
                <div className="relative">
                  <button type="button" onClick={() => setAuthMenu(prev => (prev === 'customer' ? null : 'customer'))} className="rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10">
                    Customer
                  </button>
                  {authMenu === 'customer' && (
                    <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-white/15 bg-slate-900/95 shadow-xl">
                      <Link onClick={() => setAuthMenu(null)} to="/login" className="block px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10">Login</Link>
                      <Link onClick={() => setAuthMenu(null)} to="/register" className="block border-t border-white/10 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10">Register</Link>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button type="button" onClick={() => setAuthMenu(prev => (prev === 'vendor' ? null : 'vendor'))} className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-400/20">
                    Vendor
                  </button>
                  {authMenu === 'vendor' && (
                    <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-white/15 bg-slate-900/95 shadow-xl">
                      <Link onClick={() => setAuthMenu(null)} to="/vendor/login" className="block px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10">Login</Link>
                      <Link onClick={() => setAuthMenu(null)} to="/vendor/register" className="block border-t border-white/10 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10">Register</Link>
                    </div>
                  )}
                </div>
                <Link to="/admin/login" className="rounded-full border border-violet-300/40 bg-violet-400/10 px-4 py-2 text-sm text-violet-200 transition hover:bg-violet-400/20">
                  Admin Login
                </Link>
              </>
            )}
            {user && (
              <>
                <Link to={user.role === 'vendor' ? '/vendor' : '/profile'} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-900 transition hover:bg-white">
                  <FaUserCircle className="mr-2 inline-block" /> {user.name}
                </Link>
                <button type="button" onClick={onLogout} className="rounded-full border border-rose-300/40 bg-rose-400/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-400/20">
                  Logout
                </button>
              </>
            )}
          </div>
          <button type="button" className="rounded-full border border-white/20 p-2.5 text-slate-100 md:hidden" onClick={() => { setMenuOpen(prev => !prev); setAuthMenu(null); }} aria-label="Toggle navigation">
            <FaBars />
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-white/10 px-4 py-4 md:hidden">
          <form onSubmit={onSearch} className="mb-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-white/15 bg-slate-900/70 px-4 py-3 text-slate-100"
              placeholder="Search products"
            />
          </form>
          <nav className="grid gap-2">
            {user?.role === 'admin' ? (
              <>
                <NavItem to="/admin" onClick={() => setMenuOpen(false)}>Admin Dashboard</NavItem>
                <NavItem to="/admin/settings" onClick={() => setMenuOpen(false)}>Settings</NavItem>
                <NavItem to="/helpdesk" onClick={() => setMenuOpen(false)}>Helpdesk</NavItem>
              </>
            ) : user?.role === 'vendor' ? (
              <>
                <NavItem to="/vendor" onClick={() => setMenuOpen(false)}>Vendor Dashboard</NavItem>
                <NavItem to="/vendor/settings" onClick={() => setMenuOpen(false)}>Settings</NavItem>
                <NavItem to="/helpdesk" onClick={() => setMenuOpen(false)}>Helpdesk</NavItem>
              </>
            ) : (
              <>
                <NavItem to="/customer" onClick={() => setMenuOpen(false)}>Customer Home</NavItem>
                <NavItem to="/products" onClick={() => setMenuOpen(false)}>Products</NavItem>
                <NavItem to="/shops" onClick={() => setMenuOpen(false)}>Shops</NavItem>
                <NavItem to="/settings" onClick={() => setMenuOpen(false)}>Settings</NavItem>
                <NavItem to="/helpdesk" onClick={() => setMenuOpen(false)}>Helpdesk</NavItem>
                {user?.role === 'student' && <NavItem to="/orders" onClick={() => setMenuOpen(false)}>Orders</NavItem>}
              </>
            )}
            {!user && (
              <>
                <NavItem to="/login" onClick={() => setMenuOpen(false)}>Customer Login</NavItem>
                <NavItem to="/register" onClick={() => setMenuOpen(false)}>Customer Register</NavItem>
                <NavItem to="/vendor/login" onClick={() => setMenuOpen(false)}>Vendor Login</NavItem>
                <NavItem to="/vendor/register" onClick={() => setMenuOpen(false)}>Vendor Register</NavItem>
                <NavItem to="/admin/login" onClick={() => setMenuOpen(false)}>Admin Login</NavItem>
              </>
            )}
            {user && <button type="button" onClick={onLogout} className="rounded-full border border-rose-300/40 bg-rose-400/10 px-5 py-3 text-left text-sm text-rose-200">Logout</button>}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
