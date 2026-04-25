import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CreditCard, Smartphone, Building2, ArrowLeft, CheckCircle, Lock, Bus, MapPin, ArrowRight, User } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { customerAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, American Express' },
  { id: 'esewa', label: 'eSewa', icon: Smartphone, desc: 'Nepal\'s #1 digital wallet' },
  { id: 'khalti', label: 'Khalti', icon: Smartphone, desc: 'Fast & secure payments' },
  { id: 'bank', label: 'Bank Transfer', icon: Building2, desc: 'Connect Nepal, Himalayan Bank, etc.' },
];

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { scheduleId, selectedSeats = [], schedule, fare } = location.state || {};

  const [payMethod, setPayMethod] = useState('esewa');
  const [processing, setProcessing] = useState(false);
  const [passengers, setPassengers] = useState(selectedSeats.map((s, i) => ({ seatNumber: s, name: i === 0 ? user?.name || '' : '', age: '' })));

  const totalAmount = parseFloat(fare || 0) * selectedSeats.length;

  const updatePassenger = (idx, field, value) => {
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleBook = async () => {
    if (passengers.some(p => !p.name)) return toast.error('Please fill passenger names');
    setProcessing(true);
    try {
      // Simulate payment delay
      await new Promise(r => setTimeout(r, 2000));
      const res = await customerAPI.createBooking({
        scheduleId, seats: selectedSeats,
        passengerDetails: passengers.map(p => ({ name: p.name, age: p.age })),
        paymentMethod: payMethod, boardingPoint: schedule?.route?.source,
        droppingPoint: schedule?.route?.destination
      });
      toast.success('🎉 Booking confirmed! Check your email for ticket.');
      navigate(`/ticket/${res.data.booking.id}`, { state: { booking: res.data.booking } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally { setProcessing(false); }
  };

  if (!scheduleId || !selectedSeats.length) {
    return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center"><div className="text-center"><p className="text-gray-500 mb-4">No booking data found.</p><Link to="/" className="btn-primary">Go Home</Link></div></div><Footer /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="bg-gradient-to-r from-nepal-blue to-blue-700 text-white py-6">
        <div className="max-w-5xl mx-auto px-4">
          <Link to={`/select-seats/${scheduleId}`} className="flex items-center gap-2 text-blue-200 hover:text-white mb-2 text-sm"><ArrowLeft className="h-4 w-4" /> Back to seat selection</Link>
          <h1 className="text-xl font-bold">Complete Your Booking</h1>
          <p className="text-blue-200 text-sm font-nepali">भुक्तानी सम्पन्न गर्नुहोस्</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 w-full">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          {['Search', 'Select Seats', 'Payment', 'Confirmation'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 2 ? 'bg-primary-500 text-white' : i === 2 ? 'bg-nepal-blue text-white' : 'bg-gray-200 text-gray-400'}`}>{i + 1}</div>
              <span className={i === 2 ? 'text-nepal-blue font-semibold' : i < 2 ? 'text-primary-500' : 'text-gray-400'}>{step}</span>
              {i < 3 && <div className={`h-px w-8 ${i < 2 ? 'bg-primary-300' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Passenger details */}
            <div className="card">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><User className="h-5 w-5 text-nepal-blue" /> Passenger Details</h2>
              <div className="space-y-4">
                {passengers.map((p, i) => (
                  <div key={i} className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <p className="text-sm font-semibold text-gray-600 mb-3">Passenger {i + 1} — Seat {p.seatNumber}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Full Name *</label>
                        <input value={p.name} onChange={e => updatePassenger(i, 'name', e.target.value)} className="input-field text-sm py-2" placeholder="Full name" required />
                      </div>
                      <div>
                        <label className="label text-xs">Age</label>
                        <input type="number" value={p.age} onChange={e => updatePassenger(i, 'age', e.target.value)} className="input-field text-sm py-2" placeholder="Age" min="1" max="120" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div className="card">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-nepal-blue" /> Payment Method</h2>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
                  <label key={id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${payMethod===id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value={id} checked={payMethod===id} onChange={() => setPayMethod(id)} className="text-primary-500 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-gray-600" /><span className="text-sm font-semibold">{label}</span></div>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {payMethod === 'card' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
                  <div>
                    <label className="label text-xs">Card Number</label>
                    <input className="input-field text-sm" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label text-xs">Expiry</label><input className="input-field text-sm" placeholder="MM/YY" defaultValue="12/26" /></div>
                    <div><label className="label text-xs">CVV</label><input className="input-field text-sm" placeholder="123" defaultValue="123" /></div>
                  </div>
                  <p className="text-xs text-gray-400 italic">🔒 This is a mock payment — no real transaction will occur.</p>
                </div>
              )}

              {(payMethod === 'esewa' || payMethod === 'khalti') && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                  <p className="font-medium">Mock {payMethod === 'esewa' ? 'eSewa' : 'Khalti'} Payment</p>
                  <p className="text-xs mt-1">In production, you would be redirected to {payMethod === 'esewa' ? 'eSewa' : 'Khalti'}'s payment page.</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="card sticky top-20">
              <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm mb-5">
                <div className="flex items-center gap-2 text-gray-700 font-medium border-b border-gray-100 pb-3">
                  <Bus className="h-4 w-4 text-nepal-blue" />{schedule?.bus?.name}
                </div>
                <div className="flex justify-between"><span className="text-gray-500">Route</span><span className="flex items-center gap-1">{schedule?.route?.source} <ArrowRight className="h-3 w-3"/> {schedule?.route?.destination}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{schedule?.travelDate}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Departure</span><span>{schedule?.departureTime}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Seats</span><span>{selectedSeats.sort((a,b)=>a-b).join(', ')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{selectedSeats.length} × NPR {fare}</span><span>NPR {totalAmount}</span></div>
                <div className="flex justify-between text-xs text-gray-400"><span>Service Fee</span><span>FREE</span></div>
              </div>
              <div className="border-t border-gray-200 pt-4 mb-5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="text-2xl font-extrabold text-primary-600">NPR {totalAmount}</span>
                </div>
              </div>
              <button onClick={handleBook} disabled={processing} className="btn-primary w-full flex items-center justify-center gap-2">
                {processing ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Processing...</>
                ) : (
                  <><Lock className="h-4 w-4" /> Pay NPR {totalAmount}</>
                )}
              </button>
              <p className="text-xs text-center text-gray-400 mt-3">🔒 256-bit SSL Encryption • Mock Payment</p>
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400 font-nepali">भुक्तानी सुरक्षित छ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
