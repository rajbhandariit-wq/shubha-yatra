import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SearchResults from './pages/customer/SearchResults';
import SeatSelection from './pages/customer/SeatSelection';
import ReturnBusSelection from './pages/customer/ReturnBusSelection';
import BookingSummary from './pages/customer/BookingSummary';
import Payment from './pages/customer/Payment';
import Ticket from './pages/customer/Ticket';
import Tickets from './pages/customer/Tickets';
import PaymentCallback from './pages/customer/PaymentCallback';
import PaymentFailed from './pages/customer/PaymentFailed';
import MyBookings from './pages/customer/MyBookings';

// Provider pages
import ProviderDashboard from './pages/provider/Dashboard';
import ProviderBuses from './pages/provider/Buses';
import ProviderRoutes from './pages/provider/Routes';
import ProviderStaff from './pages/provider/Staff';
import ProviderBookings from './pages/provider/Bookings';
import ProviderMessaging from './pages/provider/Messaging';
import ProviderReports from './pages/provider/Reports';
import ProviderSchedules from './pages/provider/Schedules';
import CreateBooking from "./pages/provider/CreateBooking";
import ProviderDocuments from './pages/provider/Documents';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import AdminBookings from './pages/admin/Bookings';
import AdminBilling from './pages/admin/Billing';
import BatchDetail from './pages/admin/BatchDetail';
import AdminSchedules from './pages/admin/Schedules';
import AdminRoutes from './pages/admin/AdminRoutes';
import AdminProviders from './pages/admin/Providers';
import AdminSettings from './pages/admin/Settings';

import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import BottomNav from './components/BottomNav';
import ProviderBottomNav from './components/ProviderBottomNav';
import ProviderProfile from './pages/provider/ProviderProfile';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import RefundPolicy from './pages/legal/RefundPolicy';
import ExploreLandmark from './pages/explore/ExploreLandmark';
import CustomerDashboard from './pages/customer/Dashboard';



const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function BackButtonHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthRoute = AUTH_ROUTES.some(r => location.pathname.startsWith(r));
    if (!isAuthRoute) return;

    // Push an extra history entry so the back button has somewhere to land
    window.history.pushState(null, '');

    const handlePopState = () => {
      navigate('/', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname, navigate]);

  return null;
}

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"/></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  const showBottomNav = !user || user.role === 'customer';
  const showProviderNav = user?.role === 'provider';
  return (
    <div className={showBottomNav || showProviderNav ? 'pb-16 md:pb-0' : ''}>
    <ScrollToTop />
    <BackButtonHandler />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'provider' ? '/provider' : user.role === 'admin' ? '/admin' : '/'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/select-seats/:scheduleId" element={<SeatSelection />} />
      <Route path="/return-bus-selection" element={<ReturnBusSelection />} />
      <Route path="/booking-review" element={<ProtectedRoute roles={['customer']}><BookingSummary /></ProtectedRoute>} />
      <Route path="/payment" element={<ProtectedRoute roles={['customer']}><Payment /></ProtectedRoute>} />
      <Route path="/ticket/:bookingId" element={<ProtectedRoute roles={['customer']}><Ticket /></ProtectedRoute>} />
      <Route path="/tickets" element={<ProtectedRoute roles={['customer']}><Tickets /></ProtectedRoute>} />
      <Route path="/payment/callback" element={<ProtectedRoute roles={['customer']}><PaymentCallback /></ProtectedRoute>} />
      <Route path="/payment/failed" element={<PaymentFailed />} />
      <Route path="/my-bookings" element={<ProtectedRoute roles={['customer']}><MyBookings /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute roles={['customer']}><CustomerDashboard /></ProtectedRoute>} />

      {/* Provider Routes */}
      <Route path="/provider" element={<ProtectedRoute roles={['provider']}><ProviderDashboard /></ProtectedRoute>} />
      <Route path="/provider/buses" element={<ProtectedRoute roles={['provider']}><ProviderBuses /></ProtectedRoute>} />
      <Route path="/provider/routes" element={<ProtectedRoute roles={['provider']}><ProviderRoutes /></ProtectedRoute>} />
      <Route path="/provider/schedules" element={<ProtectedRoute roles={['provider']}><ProviderSchedules /></ProtectedRoute>} />
      <Route path="/provider/staff" element={<ProtectedRoute roles={['provider']}><ProviderStaff /></ProtectedRoute>} />
      <Route path="/provider/bookings" element={<ProtectedRoute roles={['provider']}><ProviderBookings /></ProtectedRoute>} />
      <Route path="/provider/messaging" element={<ProtectedRoute roles={['provider']}><ProviderMessaging /></ProtectedRoute>} />
      <Route path="/provider/reports" element={<ProtectedRoute roles={['provider']}><ProviderReports /></ProtectedRoute>} />
      <Route path="/provider/create-booking" element={<CreateBooking />} />
      <Route path="/provider/documents" element={<ProtectedRoute roles={['provider']}><ProviderDocuments /></ProtectedRoute>} />
      <Route path="/provider/profile" element={<ProtectedRoute roles={['provider']}><ProviderProfile /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute roles={['admin']}><AdminBookings /></ProtectedRoute>} />
      <Route path="/admin/schedules" element={<ProtectedRoute roles={['admin']}><AdminSchedules /></ProtectedRoute>} />
      <Route path="/admin/schedules/routes" element={<ProtectedRoute roles={['admin']}><AdminRoutes /></ProtectedRoute>} />
      <Route path="/admin/providers" element={<ProtectedRoute roles={['admin']}><AdminProviders /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><AdminSettings /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />
      <Route path="/admin/billing" element={<ProtectedRoute roles={['admin']}><AdminBilling /></ProtectedRoute>} />
      <Route path="/admin/billing/batches/:id" element={<ProtectedRoute roles={['admin']}><BatchDetail /></ProtectedRoute>} />

      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/explore/:slug" element={<ExploreLandmark />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    {showBottomNav && <BottomNav />}
    {showProviderNav && <ProviderBottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '10px', background: '#333', color: '#fff' } }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
