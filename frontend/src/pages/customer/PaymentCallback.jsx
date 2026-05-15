import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { paymentAPI } from '../../services/api';

export default function PaymentCallback() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const [failed,  setFailed]  = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const gateway    = params.get('gateway');
    const bookingStr = params.get('bookingIds');
    const bookingIds = bookingStr?.split(',').filter(Boolean) || [];

    const fail = (msg) => {
      setFailed(true);
      setMessage(msg);
      // Pass bookingIds so PaymentFailed can release the seats
      setTimeout(() => navigate('/payment/failed', {
        state: { message: msg, bookingIds },
        replace: true,
      }), 1500);
    };

    if (!bookingIds.length) { fail('No booking IDs in callback.'); return; }

    const verify = async () => {
      try {
        if (gateway === 'esewa') {
          const data = params.get('data');
          if (!data) { fail('Missing eSewa response data.'); return; }
          const res = await paymentAPI.verifyEsewa({ data, bookingIds });
          sessionStorage.removeItem('sy_payment_ctx');
          const bookings = res.data.bookings;
          navigate('/tickets', { state: { bookings, isRoundTrip: bookings.length > 1 }, replace: true });

        } else if (gateway === 'khalti') {
          const pidx = params.get('pidx') || sessionStorage.getItem('khalti_pidx');
          if (!pidx) { fail('Missing Khalti pidx.'); return; }
          const res = await paymentAPI.verifyKhalti({ pidx, bookingIds });
          sessionStorage.removeItem('sy_payment_ctx');
          sessionStorage.removeItem('khalti_pidx');
          const bookings = res.data.bookings;
          navigate('/tickets', { state: { bookings, isRoundTrip: bookings.length > 1 }, replace: true });

        } else {
          fail(`Unknown payment gateway: ${gateway}`);
        }
      } catch (err) {
        fail(err.response?.data?.message || err.message || 'Payment verification failed.');
      }
    };

    verify();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          {!failed ? (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800">Verifying Payment</h2>
              <p className="text-gray-500 mt-2">Please wait while we confirm your payment...</p>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800">Verification Failed</h2>
              <p className="text-gray-500 mt-2">{message}</p>
              <p className="text-gray-400 text-sm mt-1">Redirecting...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
