import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Building2, ArrowLeft, Lock, Bus, ArrowRight, User, CheckCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const STRIPE_STYLE = {
  style: {
    base: {
      fontSize: '14px',
      color: '#111827',
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};

// ─── Card preview (decorative — Stripe Elements own the actual input) ──────────
function CardFace({ holder }) {
  return (
    <div className="w-full h-36 bg-gradient-to-br from-nepal-blue via-blue-700 to-indigo-900 rounded-2xl p-5 text-white shadow-lg mb-4 relative overflow-hidden select-none">
      <div className="absolute -right-10 -top-10 w-36 h-36 bg-white/5 rounded-full" />
      <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-white/5 rounded-full" />
      <div className="relative flex flex-col h-full justify-between">
        <div className="flex justify-between items-start">
          <div className="w-9 h-6 rounded bg-yellow-400/70 border border-yellow-300/50" />
          <span className="font-bold italic text-lg tracking-wider opacity-80">VISA / MC</span>
        </div>
        <p className="font-mono text-lg tracking-[0.25em] opacity-60">•••• •••• •••• ••••</p>
        <div className="flex justify-between text-xs">
          <div>
            <p className="text-white/50 uppercase text-[10px] mb-0.5">Card Holder</p>
            <p className="font-semibold uppercase truncate max-w-[180px]">{holder || 'YOUR NAME'}</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 uppercase text-[10px] mb-0.5">Secured by</p>
            <p className="font-semibold text-xs">Stripe</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const METHODS = [
  { id: 'card',   label: 'Credit/Debit Card', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-400'   },
  { id: 'esewa',  label: 'eSewa',             color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-400'  },
  { id: 'khalti', label: 'Khalti',            color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-400' },
  { id: 'bank',   label: 'Bank Transfer',     color: 'text-gray-700',   bg: 'bg-gray-50',   border: 'border-gray-400'   },
];

// Wrap with Elements so child can call useStripe / useElements
export default function Payment() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentInner />
    </Elements>
  );
}

function PaymentInner() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();
  const stripe    = useStripe();
  const elements  = useElements();

  const {
    isRoundTrip,
    outbound, return: returnLeg,
    scheduleId, selectedSeats = [], schedule, fare,
  } = location.state || {};

  const activeSeats = isRoundTrip ? (outbound?.selectedSeats || []) : selectedSeats;

  const [payMethod,   setPayMethod]   = useState('card');
  const [processing,  setProcessing]  = useState(false);
  const [cardHolder,  setCardHolder]  = useState(user?.name || '');
  const [passengers,  setPassengers]  = useState(
    activeSeats.map((s, i) => ({ seatNumber: s, name: i === 0 ? user?.name || '' : '', age: '' }))
  );

  // Tracks Stripe pending booking IDs so we can cancel if user navigates away
  const pendingIdsRef = useRef([]);

  // On unmount — cancel any Stripe pending bookings that were never confirmed
  useEffect(() => {
    return () => {
      if (pendingIdsRef.current.length === 0) return;
      const token = localStorage.getItem('sy_token');
      fetch('/api/payment/cancel', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingIds: pendingIdsRef.current }),
      }).catch(() => {});
    };
  }, []);

  const outboundTotal = isRoundTrip
    ? parseFloat(outbound?.fare || 0) * (outbound?.selectedSeats?.length || 0)
    : parseFloat(fare || 0) * selectedSeats.length;
  const returnTotal = isRoundTrip
    ? parseFloat(returnLeg?.fare || 0) * (returnLeg?.selectedSeats?.length || 0)
    : 0;
  const totalAmount = outboundTotal + returnTotal;

  const updatePassenger = (i, field, val) =>
    setPassengers(p => p.map((x, j) => j === i ? { ...x, [field]: val } : x));

  const buildBookingRequests = () => {
    const pax = passengers.map(p => ({ name: p.name, age: p.age }));
    if (isRoundTrip) {
      return [
        { scheduleId: outbound.scheduleId,  seats: outbound.selectedSeats,  passengerDetails: pax },
        { scheduleId: returnLeg.scheduleId, seats: returnLeg.selectedSeats, passengerDetails: pax },
      ];
    }
    return [{ scheduleId, seats: selectedSeats, passengerDetails: pax }];
  };

  const goToTickets = (bookings) => {
    if (bookings.length === 1) {
      navigate(`/ticket/${bookings[0].id}`, { state: { booking: bookings[0] } });
    } else {
      navigate('/tickets', { state: { bookings, isRoundTrip } });
    }
  };

  const handlePay = async () => {
    if (passengers.some(p => !p.name.trim())) return toast.error('Please fill all passenger names');
    setProcessing(true);
    try {
      const bookings = buildBookingRequests();

      if (payMethod === 'card') {
        if (!stripe || !elements) throw new Error('Stripe not loaded yet');

        // Create pending bookings + PaymentIntent
        const intentRes = await paymentAPI.createStripeIntent({ bookings });
        const { clientSecret, bookingIds } = intentRes.data;

        // Track so unmount cleanup can cancel if user navigates away
        pendingIdsRef.current = bookingIds;

        const cardElement = elements.getElement(CardNumberElement);
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: { name: cardHolder || passengers[0]?.name },
          },
        });

        if (error) {
          // Explicit Stripe decline — cancel immediately and stay on page
          pendingIdsRef.current = [];
          await paymentAPI.cancelPayment({ bookingIds }).catch(() => {});
          throw new Error(error.message);
        }

        // Payment succeeded — clear ref before navigating (prevents unmount cancel)
        pendingIdsRef.current = [];
        const res = await paymentAPI.confirmStripe({ paymentIntentId: paymentIntent.id, bookingIds });
        toast.success('Payment successful!');
        goToTickets(res.data.bookings);

      } else if (payMethod === 'esewa') {
        const res = await paymentAPI.initiateEsewa({ bookings });
        const { gatewayUrl, params, bookingIds } = res.data;
        // Save full context so PaymentFailed can restore it for "Try Again"
        sessionStorage.setItem('sy_payment_ctx', JSON.stringify(location.state));
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = gatewayUrl;
        Object.entries(params).forEach(([k, v]) => {
          const inp = document.createElement('input');
          inp.type = 'hidden'; inp.name = k; inp.value = String(v);
          form.appendChild(inp);
        });
        document.body.appendChild(form);
        form.submit();

      } else if (payMethod === 'khalti') {
        const res = await paymentAPI.initiateKhalti({ bookings });
        const { paymentUrl, bookingIds, pidx } = res.data;
        // Save full context so PaymentFailed can restore it for "Try Again"
        sessionStorage.setItem('sy_payment_ctx', JSON.stringify(location.state));
        sessionStorage.setItem('khalti_pidx', pidx);
        window.location.href = paymentUrl;

      } else if (payMethod === 'bank') {
        const res = await paymentAPI.payByBank({ bookings });
        toast.success('Booking created! Complete the bank transfer to confirm.');
        navigate('/tickets', {
          state: { bookings: res.data.bookings, isRoundTrip, bankDetails: res.data.bankDetails }
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (!isRoundTrip && (!scheduleId || !selectedSeats.length)) {
    return (
      <div className="min-h-screen flex flex-col"><Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">No booking data found.</p>
            <Link to="/" className="btn-primary">Go Home</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const steps      = isRoundTrip ? ['Search', 'Outbound Seats', 'Return Seats', 'Review', 'Payment'] : ['Search', 'Select Seats', 'Payment', 'Confirmation'];
  const activeStep = isRoundTrip ? 4 : 2;
  const payBtnLabel = { card: `Pay NPR ${totalAmount.toFixed(0)}`, esewa: 'Pay with eSewa', khalti: 'Pay with Khalti', bank: 'Confirm & Get Bank Details' }[payMethod];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="bg-gradient-to-r from-nepal-blue to-blue-700 text-white py-6">
        <div className="max-w-5xl mx-auto px-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-200 hover:text-white mb-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-xl font-bold">Complete Your Booking</h1>
          <p className="text-blue-200 text-sm font-nepali">भुक्तानी सम्पन्न गर्नुहोस्</p>
        </div>
      </div>

      {/* Progress stepper */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1 text-xs flex-wrap">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs
                  ${i < activeStep ? 'bg-primary-500 text-white' : i === activeStep ? 'bg-nepal-blue text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {i + 1}
                </div>
                <span className={i === activeStep ? 'text-nepal-blue font-semibold' : i < activeStep ? 'text-primary-500' : 'text-gray-400'}>{step}</span>
                {i < steps.length - 1 && <div className={`h-px w-4 sm:w-6 ${i < activeStep ? 'bg-primary-300' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Passenger details */}
            <div className="card">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-nepal-blue" /> Passenger Details
                {isRoundTrip && <span className="text-xs text-gray-400 font-normal">(applied to both legs)</span>}
              </h2>
              <div className="space-y-4">
                {passengers.map((p, i) => (
                  <div key={i} className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <p className="text-sm font-semibold text-gray-600 mb-3">Passenger {i + 1} — Seat {p.seatNumber}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Full Name *</label>
                        <input value={p.name} onChange={e => updatePassenger(i, 'name', e.target.value)}
                          className="input-field text-sm py-2" placeholder="Full name" />
                      </div>
                      <div>
                        <label className="label text-xs">Age</label>
                        <input type="number" value={p.age} onChange={e => updatePassenger(i, 'age', e.target.value)}
                          className="input-field text-sm py-2" placeholder="Age" min="1" max="120" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment method picker */}
            <div className="card">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-nepal-blue" /> Payment Method
              </h2>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {METHODS.map(m => (
                  <button key={m.id} onClick={() => setPayMethod(m.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                      ${payMethod === m.id ? `${m.border} ${m.bg}` : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${payMethod === m.id ? m.bg : 'bg-gray-100'}`}>
                      {m.id === 'card'   && <CreditCard className="h-5 w-5 text-blue-600" />}
                      {m.id === 'esewa'  && <span className="text-green-600 font-extrabold text-xl leading-none">e</span>}
                      {m.id === 'khalti' && <span className="text-purple-600 font-extrabold text-xl leading-none">K</span>}
                      {m.id === 'bank'   && <Building2 className="h-5 w-5 text-gray-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${payMethod === m.id ? m.color : 'text-gray-700'}`}>{m.label}</p>
                      <p className="text-xs text-gray-400">
                        {m.id === 'card'   && 'Visa / Mastercard'}
                        {m.id === 'esewa'  && 'Digital wallet'}
                        {m.id === 'khalti' && 'Digital wallet'}
                        {m.id === 'bank'   && 'Direct transfer'}
                      </p>
                    </div>
                    {payMethod === m.id && <CheckCircle className={`h-4 w-4 ml-auto flex-shrink-0 ${m.color}`} />}
                  </button>
                ))}
              </div>

              {/* ── Stripe card form ── */}
              {payMethod === 'card' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <CardFace holder={cardHolder} />
                  <div className="space-y-3">
                    <div>
                      <label className="label text-xs">Card Holder Name</label>
                      <input value={cardHolder} onChange={e => setCardHolder(e.target.value)}
                        className="input-field text-sm uppercase" placeholder="Name on card" />
                    </div>
                    <div>
                      <label className="label text-xs">Card Number</label>
                      <div className="input-field py-3">
                        <CardNumberElement options={STRIPE_STYLE} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Expiry Date</label>
                        <div className="input-field py-3">
                          <CardExpiryElement options={STRIPE_STYLE} />
                        </div>
                      </div>
                      <div>
                        <label className="label text-xs">CVV</label>
                        <div className="input-field py-3">
                          <CardCvcElement options={STRIPE_STYLE} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Lock className="h-3 w-3" /> Secured by Stripe
                    </p>
                    <p className="text-xs text-gray-400">Test: 4242 4242 4242 4242</p>
                  </div>
                </div>
              )}

              {/* ── eSewa ── */}
              {payMethod === 'esewa' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-extrabold text-2xl leading-none">e</span>
                    </div>
                    <div>
                      <p className="font-bold text-green-800">eSewa Sandbox</p>
                      <p className="text-xs text-green-600">You'll be redirected to eSewa's test gateway</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-xs space-y-2 border border-green-100">
                    <p className="font-semibold text-green-800">Test Credentials:</p>
                    <div className="flex justify-between"><span className="text-gray-500">eSewa ID</span><span className="font-mono font-bold">9806800001</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Password</span><span className="font-mono font-bold">Nepal@123</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">MPIN</span><span className="font-mono font-bold">1122</span></div>
                  </div>
                  <p className="text-xs text-green-700 mt-2">After completing payment you'll be redirected back automatically.</p>
                </div>
              )}

              {/* ── Khalti ── */}
              {payMethod === 'khalti' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-700 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-extrabold text-2xl leading-none">K</span>
                    </div>
                    <div>
                      <p className="font-bold text-purple-800">Khalti Sandbox</p>
                      <p className="text-xs text-purple-600">You'll be redirected to Khalti's test gateway</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-xs space-y-2 border border-purple-100">
                    <p className="font-semibold text-purple-800">Test Credentials:</p>
                    <div className="flex justify-between"><span className="text-gray-500">Mobile</span><span className="font-mono font-bold">9800000001</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">MPIN</span><span className="font-mono font-bold">1111</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">OTP</span><span className="font-mono font-bold">987654</span></div>
                  </div>
                  <p className="text-xs text-purple-700 mt-2">After completing payment you'll be redirected back automatically.</p>
                </div>
              )}

              {/* ── Bank Transfer ── */}
              {payMethod === 'bank' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Bank Transfer</p>
                      <p className="text-xs text-gray-500">Account details provided after confirmation</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-xs border border-gray-200">
                    <p className="text-gray-500">Your seats will be held for 24 hours. Bank account details will appear on the next screen to complete the transfer.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Summary sidebar ── */}
          <div>
            <div className="card sticky top-20">
              <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>

              <div className={`space-y-2 text-sm ${isRoundTrip ? 'mb-4 pb-4 border-b border-dashed border-gray-200' : 'mb-5'}`}>
                <p className="text-xs font-semibold text-gray-500 uppercase">{isRoundTrip ? '→ Outbound' : 'Journey'}</p>
                <div className="flex items-center gap-1 text-gray-700 font-medium">
                  <Bus className="h-4 w-4 text-nepal-blue flex-shrink-0" />
                  <span className="truncate">{isRoundTrip ? outbound?.schedule?.bus?.name : schedule?.bus?.name}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">Route</span>
                  <span className="flex items-center gap-0.5 text-xs">
                    {(isRoundTrip ? outbound?.schedule : schedule)?.route?.source}
                    <ArrowRight className="h-3 w-3 mx-0.5 flex-shrink-0" />
                    {(isRoundTrip ? outbound?.schedule : schedule)?.route?.destination}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{(isRoundTrip ? outbound?.schedule : schedule)?.travelDate}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Seats</span><span>{(isRoundTrip ? outbound?.selectedSeats : selectedSeats)?.sort((a,b)=>a-b).join(', ')}</span></div>
                <div className="flex justify-between font-medium">
                  <span>{(isRoundTrip ? outbound?.selectedSeats : selectedSeats)?.length} × NPR {isRoundTrip ? outbound?.fare : fare}</span>
                  <span>NPR {outboundTotal.toFixed(0)}</span>
                </div>
              </div>

              {isRoundTrip && returnLeg && (
                <div className="space-y-2 text-sm mb-5 pb-4 border-b border-dashed border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase">↩ Return</p>
                  <div className="flex items-center gap-1 text-gray-700 font-medium">
                    <Bus className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                    <span className="truncate">{returnLeg.schedule?.bus?.name}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500 flex-shrink-0">Route</span>
                    <span className="flex items-center gap-0.5 text-xs">
                      {returnLeg.schedule?.route?.source}
                      <ArrowRight className="h-3 w-3 mx-0.5 flex-shrink-0" />
                      {returnLeg.schedule?.route?.destination}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{returnLeg.schedule?.travelDate}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Seats</span><span>{returnLeg.selectedSeats?.sort((a,b)=>a-b).join(', ')}</span></div>
                  <div className="flex justify-between font-medium">
                    <span>{returnLeg.selectedSeats?.length} × NPR {returnLeg.fare}</span>
                    <span>NPR {returnTotal.toFixed(0)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-xs text-gray-400 mb-3"><span>Service Fee</span><span>FREE</span></div>
              <div className="border-t border-gray-200 pt-4 mb-5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="text-2xl font-extrabold text-primary-600">NPR {totalAmount.toFixed(0)}</span>
                </div>
              </div>

              <button onClick={handlePay} disabled={processing || (payMethod === 'card' && !stripe)}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {processing
                  ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Processing...</>
                  : <><Lock className="h-4 w-4" /> {payBtnLabel}</>
                }
              </button>
              <p className="text-xs text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" /> Secured by 256-bit SSL
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
