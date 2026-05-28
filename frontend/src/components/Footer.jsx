import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-8 border-t border-white/10 bg-slate-950/60">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 md:grid-cols-3 md:px-8">
        <div>
          <h3 className="text-base font-semibold text-slate-100">LOBBy</h3>
          <p className="mt-1 text-xs text-slate-400">Campus marketplace for students, vendors, and admins.</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Navigation</h4>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-300">
            <Link to="/customer" className="hover:text-cyan-300">Home</Link>
            <Link to="/products" className="hover:text-cyan-300">Products</Link>
            <Link to="/shops" className="hover:text-cyan-300">Shops</Link>
            <Link to="/settings" className="hover:text-cyan-300">Settings</Link>
            <Link to="/helpdesk" className="hover:text-cyan-300">Helpdesk</Link>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Support</h4>
          <p className="mt-2 text-xs text-slate-400">Need help? Report inconvenience or issues quickly via helpdesk.</p>
          <Link to="/helpdesk" className="mt-3 inline-flex rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-400/20">
            Report an Issue
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
