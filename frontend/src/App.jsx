import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './context/ThemeContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import ShopListingPage from './pages/ShopListingPage';
import ShopDetailsPage from './pages/ShopDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import CustomerSettingsPage from './pages/CustomerSettingsPage';
import VendorSettingsPage from './pages/VendorSettingsPage';
import GeneralSettingsPage from './pages/GeneralSettingsPage';
import VendorDashboardPage from './pages/VendorDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import DeliveryLoginPage from './pages/DeliveryLoginPage';
import DeliveryDashboardPage from './pages/DeliveryDashboardPage';
import NotificationsPage from './pages/NotificationsPage';
import ChatPage from './pages/ChatPage';
import HelpdeskPage from './pages/HelpdeskPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to={allowedRoles?.includes('admin') ? '/admin/login' : '/login'} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'vendor') return <Navigate to="/vendor" replace />;
    if (user.role === 'delivery') return <Navigate to="/delivery" replace />;
    return <Navigate to="/customer" replace />;
  }
  return children;
};

const RoleGateway = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/customer" replace />;
  if (user.role === 'delivery') return <Navigate to="/delivery" replace />;
  return <Navigate to={user.role === 'vendor' ? '/vendor' : '/customer'} replace />;
};

const SettingsGateway = () => {
  const { user } = useAuth();
  if (!user) return <GeneralSettingsPage />;
  if (user.role === 'admin') return <Navigate to="/admin/settings" replace />;
  if (user.role === 'vendor') return <Navigate to="/vendor/settings" replace />;
  return <CustomerSettingsPage />;
};

function App() {
  const { theme } = useTheme();
  return (
    <div className={`min-h-screen ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        <Routes>
          <Route path="/" element={<RoleGateway />} />
          <Route path="/customer" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/vendor/login" element={<LoginPage roleHint="vendor" />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/vendor/register" element={<RegisterPage roleHint="vendor" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/vendor/forgot-password" element={<ForgotPasswordPage roleHint="vendor" />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/shops" element={<ShopListingPage />} />
          <Route path="/shops/:id" element={<ShopDetailsPage />} />
          <Route path="/cart" element={<ProtectedRoute allowedRoles={['student']}><CartPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute allowedRoles={['student']}><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute allowedRoles={['student']}><OrdersPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['student']}><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings" element={<SettingsGateway />} />
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={['student']}><NotificationsPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute allowedRoles={['student']}><ChatPage /></ProtectedRoute>} />
          <Route path="/helpdesk" element={<HelpdeskPage />} />
          <Route path="/vendor" element={<ProtectedRoute allowedRoles={[ 'vendor' ]}><VendorDashboardPage /></ProtectedRoute>} />
          <Route path="/vendor/settings" element={<ProtectedRoute allowedRoles={[ 'vendor' ]}><VendorSettingsPage /></ProtectedRoute>} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={[ 'admin' ]}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={[ 'admin' ]}><AdminSettingsPage /></ProtectedRoute>} />
          <Route path="/delivery/login" element={<DeliveryLoginPage />} />
          <Route path="/delivery" element={<ProtectedRoute allowedRoles={[ 'delivery' ]}><DeliveryDashboardPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/customer" replace />} />
        </Routes>
      </main>
      <Link
        to="/helpdesk"
        className="fixed bottom-4 right-4 z-40 rounded-full border border-cyan-300/40 bg-cyan-400/15 px-4 py-2 text-xs font-semibold text-cyan-200 shadow-lg backdrop-blur hover:bg-cyan-400/25"
      >
        Need Help?
      </Link>
      <Footer />
    </div>
  );
}

export default App;
