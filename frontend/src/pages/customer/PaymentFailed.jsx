import { useEffect, useRef } from 'react';
import { useLocation, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { XCircle, Home, RefreshCw } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { paymentAPI } from '../../services/api';

export default function PaymentFailed() {
  const location       = useLocation();
  const [params]       = useSearchParams();
  const navigate       = useNavigate();
  const cancelledRef   = useRef(false);

  // bookingIds can come from URL params (eSewa failure_url) or from state (PaymentCallback)
  const bookingStr = params.get('bookingIds') || '';
  const bookingIds = location.state?.bookingIds
    || (bookingStr ? bookingStr.split(',').filter(Boolean) : []);

  const message = location.state?.message || 'Your payment could not be processed.';

  // Release held seats — only once, even in dev StrictMode double-invoke
  useEffect(() => {
    if (cancelledRef.current || !bookingIds.length) return;
    cancelledRef.current = true;
    paymentAPI.cancelPayment({ bookingIds }).catch(() => {});
  }, []);

  const handleTryAgain = () => {
    const raw = sessionStorage.getItem('sy_payment_ctx');
    if (raw) {
      try {
        const ctx = JSON.parse(raw);
        sessionStorage.removeItem('sy_payment_ctx');
        navigate('/payment', { state: ctx });
        return;
      } catch { /* fall through */ }
    }
    // Fallback: go back in history (works when user was on /payment before redirect)
    navigate(-2);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-1">{message}</p>
          <p className="text-gray-400 text-sm mb-6">
            {bookingIds.length ? 'Your seats have been released.' : 'Please try again.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn-outline flex items-center gap-2">
              <Home className="h-4 w-4" /> Go Home
            </Link>
            <button onClick={handleTryAgain} className="btn-primary flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
