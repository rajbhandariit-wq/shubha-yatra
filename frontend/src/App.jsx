import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SearchResults from './pages/customer/SearchResults';
import SeatSelection from './pages/customer/SeatSelection';
import Payment from './pages/customer/Payment';
import Ticket from './pages/customer/Ticket';
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

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"/></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'provider' ? '/provider' : user.role === 'admin' ? '/admin' : '/'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/select-seats/:scheduleId" element={<SeatSelection />} />
      <Route path="/payment" element={<ProtectedRoute roles={['customer']}><Payment /></ProtectedRoute>} />
      <Route path="/ticket/:bookingId" element={<ProtectedRoute roles={['customer']}><Ticket /></ProtectedRoute>} />
      <Route path="/my-bookings" element={<ProtectedRoute roles={['customer']}><MyBookings /></ProtectedRoute>} />

      {/* Provider Routes */}
      <Route path="/provider" element={<ProtectedRoute roles={['provider']}><ProviderDashboard /></ProtectedRoute>} />
      <Route path="/provider/buses" element={<ProtectedRoute roles={['provider']}><ProviderBuses /></ProtectedRoute>} />
      <Route path="/provider/routes" element={<ProtectedRoute roles={['provider']}><ProviderRoutes /></ProtectedRoute>} />
      <Route path="/provider/schedules" element={<ProtectedRoute roles={['provider']}><ProviderSchedules /></ProtectedRoute>} />
      <Route path="/provider/staff" element={<ProtectedRoute roles={['provider']}><ProviderStaff /></ProtectedRoute>} />
      <Route path="/provider/bookings" element={<ProtectedRoute roles={['provider']}><ProviderBookings /></ProtectedRoute>} />
      <Route path="/provider/messaging" element={<ProtectedRoute roles={['provider']}><ProviderMessaging /></ProtectedRoute>} />
      <Route path="/provider/reports" element={<ProtectedRoute roles={['provider']}><ProviderReports /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
