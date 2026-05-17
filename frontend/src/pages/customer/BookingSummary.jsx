import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bus, MapPin, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { CATEGORY_META } from '../../utils/seatLayout';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

function LegCard({ leg, label, color }) {
  const schedule = leg?.schedule;
  const route    = schedule?.route;
  const bus      = schedule?.bus;
  const total    = (parseFloat(leg?.fare || 0) * leg?.selectedSeats?.length).toFixed(0);

  return (
    <div className={`rounded-2xl border-2 ${color} overflow-hidden`}>
      <div className={`px-5 py-3 flex items-center justify-between ${color.replace('border-', 'bg-').replace('-300', '-50')}`}>
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <CheckCircle className="h-5 w-5 text-green-500" />
      </div>

      <div className="bg-white px-5 py-4 space-y-3">
        {/* Route + time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-gray-800">
            <MapPin className="h-4 w-4 text-primary-500 shrink-0" />
            {route?.source}
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <MapPin className="h-4 w-4 text-nepal-blue shrink-0" />
            {route?.destination}
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {schedule?.departureTime} → {schedule?.arrivalTime}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Date</p>
            <p className="font-medium flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-gray-400" />{schedule?.travelDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Bus</p>
            <p className="font-medium flex items-center gap-1"><Bus className="h-3.5 w-3.5 text-gray-400" />{bus?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Type</p>
            {bus?.seatLayout?.busCategory && CATEGORY_META[bus.seatLayout.busCategory] ? (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_META[bus.seatLayout.busCategory].color}`}>
                {CATEGORY_META[bus.seatLayout.busCategory].icon} {CATEGORY_META[bus.seatLayout.busCategory].label}
              </span>
            ) : (
              <p className="font-medium">{bus?.type || '—'}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Seats</p>
            <p className="font-medium">{leg?.selectedSeats?.sort((a, b) => a - b).join(', ')}</p>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-3">
          <span className="text-sm text-gray-500">{leg?.selectedSeats?.length} seat(s) × NPR {leg?.fare}</span>
          <span className="text-lg font-extrabold text-primary-600">NPR {total}</span>
        </div>
      </div>
    </div>
  );
}

export default function BookingSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const { outbound, return: returnLeg } = location.state || {};

  if (!outbound || !returnLeg) {
    return (
      <div className="min-h-screen flex flex-col"><Navbar />
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <div>
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Booking context lost. Please start again.</p>
            <Link to="/" className="btn-primary">Go Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const outboundTotal = parseFloat(outbound.fare || 0) * outbound.selectedSeats?.length;
  const returnTotal   = parseFloat(returnLeg.fare || 0) * returnLeg.selectedSeats?.length;
  const grandTotal    = (outboundTotal + returnTotal).toFixed(0);

  const handleProceedToPayment = () => {
    navigate('/payment', {
      state: {
        isRoundTrip: true,
        outbound,
        return: returnLeg,
        // flat fields kept for one-way compat (Payment reads these too)
        scheduleId:    outbound.scheduleId,
        selectedSeats: outbound.selectedSeats,
        schedule:      outbound.schedule,
        fare:          outbound.fare,
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="bg-gradient-to-r from-nepal-blue to-blue-700 text-white py-6">
        <div className="max-w-3xl mx-auto px-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-200 hover:text-white mb-3 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to return seat selection
          </button>
          <h1 className="text-xl font-bold">Review Your Booking</h1>
          <p className="text-blue-200 text-sm font-nepali">बुकिङ समीक्षा गर्नुहोस्</p>
        </div>
      </div>

      {/* Progress stepper */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1 text-xs">
            {['Search', 'Outbound Seats', 'Return Seats', 'Review', 'Payment'].map((step, i) => (
              <div key={step} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${i < 3 ? 'bg-primary-500 text-white' : i === 3 ? 'bg-nepal-blue text-white' : 'bg-gray-200 text-gray-400'}`}>{i + 1}</div>
                <span className={i === 3 ? 'text-nepal-blue font-semibold' : i < 3 ? 'text-primary-500' : 'text-gray-400'}>{step}</span>
                {i < 4 && <div className={`h-px w-4 sm:w-8 ${i < 3 ? 'bg-primary-300' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 w-full space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Trip Summary</h2>
          <div className="space-y-4">
            <LegCard leg={outbound}   label="→ Outbound Journey" color="border-primary-300" />
            <LegCard leg={returnLeg}  label="↩ Return Journey"   color="border-indigo-300" />
          </div>
        </div>

        {/* Grand total card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-lg">Price Breakdown</h3>
          </div>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Outbound ({outbound.selectedSeats?.length} seat{outbound.selectedSeats?.length !== 1 ? 's' : ''})</span>
              <span>NPR {outboundTotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Return ({returnLeg.selectedSeats?.length} seat{returnLeg.selectedSeats?.length !== 1 ? 's' : ''})</span>
              <span>NPR {returnTotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Service Fee</span><span>FREE</span>
            </div>
          </div>
          <div className="flex justify-between items-center border-t border-gray-200 pt-4">
            <span className="font-bold text-gray-800 text-lg">Total Amount</span>
            <span className="text-3xl font-extrabold text-primary-600">NPR {grandTotal}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium">
            ← Change Seats
          </button>
          <button onClick={handleProceedToPayment} className="flex-2 btn-primary px-8 py-3 flex items-center justify-center gap-2 text-base font-semibold">
            Proceed to Payment <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">🔒 Your booking is secured with 256-bit SSL encryption</p>
      </div>
      <Footer />
    </div>
  );
}
