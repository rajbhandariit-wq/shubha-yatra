import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Bus, MapPin, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SeatMap from '../../components/SeatMap';
import { customerAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ONE_WAY_STEPS  = ['Search', 'Select Seats', 'Payment', 'Confirmation'];
const RT_STEPS       = ['Search', 'Outbound Seats', 'Return Seats', 'Review', 'Payment'];

export default function SeatSelection() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const roundTripContext = location.state?.roundTripContext; // outbound leg of round trip
  const isReturnLeg     = !!location.state?.isReturnLeg;
  const outboundBooking = location.state?.outboundBooking;  // carried from outbound leg

  const isRoundTrip = !!(roundTripContext || isReturnLeg);
  const steps       = isRoundTrip ? RT_STEPS : ONE_WAY_STEPS;
  const activeStep  = isReturnLeg ? 2 : 1; // 0-indexed within steps array

  const [seatData, setSeatData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerAPI.getSeats(scheduleId)
      .then(r => setSeatData(r.data))
      .catch(() => toast.error('Failed to load seats'))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  const handleProceed = () => {
    if (selectedSeats.length === 0) return toast.error('Please select at least one seat');
    if (!user) {
      toast('Please login to book tickets', { icon: '🔐' });
      return navigate('/login', { state: { from: `/select-seats/${scheduleId}` } });
    }

    const thisLeg = { scheduleId, selectedSeats, schedule: seatData?.schedule, fare: seatData?.schedule?.fare };

    if (roundTripContext) {
      // Outbound done → go pick a return bus
      navigate('/return-bus-selection', { state: { roundTripContext, outboundBooking: thisLeg } });
    } else if (isReturnLeg) {
      // Return done → go review both legs
      navigate('/booking-review', { state: { outbound: outboundBooking, return: thisLeg } });
    } else {
      // One-way → straight to payment
      navigate('/payment', { state: { scheduleId, selectedSeats, schedule: seatData?.schedule, fare: seatData?.schedule?.fare } });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col"><Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent mx-auto mb-3" />
          <p className="text-gray-500 font-nepali">सिट लोड हुँदैछ...</p>
        </div>
      </div>
    </div>
  );

  const schedule = seatData?.schedule;
  const route    = schedule?.route;
  const bus      = schedule?.bus;

  const proceedLabel = roundTripContext
    ? 'Continue to Return Journey'
    : isReturnLeg
      ? 'Review Booking'
      : 'Proceed to Payment';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className={`text-white py-6 ${isReturnLeg ? 'bg-gradient-to-r from-blue-700 to-indigo-700' : 'bg-gradient-to-r from-nepal-blue to-blue-700'}`}>
        <div className="max-w-5xl mx-auto px-4">
          <Link
            to={`/search?source=${route?.source}&destination=${route?.destination}&date=${schedule?.travelDate}&seats=1`}
            className="flex items-center gap-2 text-blue-200 hover:text-white mb-3 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back to results
          </Link>

          {/* Round-trip leg badge */}
          {isRoundTrip && (
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-2 ${isReturnLeg ? 'bg-indigo-500/40' : 'bg-blue-500/40'}`}>
              {isReturnLeg ? '↩ Return Journey — Step 2 of 2' : '→ Outbound Journey — Step 1 of 2'}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Bus className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">{bus?.name} — {bus?.type}</h1>
              <p className="text-blue-200 text-sm">{bus?.registrationNumber} • {bus?.provider?.companyName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress stepper */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1 text-xs">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  i < activeStep ? 'bg-primary-500 text-white'
                  : i === activeStep ? 'bg-nepal-blue text-white'
                  : 'bg-gray-200 text-gray-400'
                }`}>{i + 1}</div>
                <span className={i === activeStep ? 'text-nepal-blue font-semibold' : i < activeStep ? 'text-primary-500' : 'text-gray-400'}>{step}</span>
                {i < steps.length - 1 && <div className={`h-px w-4 sm:w-8 ${i < activeStep ? 'bg-primary-300' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seat map */}
          <div className="lg:col-span-2">
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <MapPin className="h-4 w-4 text-primary-500" /> {route?.source}
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <MapPin className="h-4 w-4 text-nepal-blue" /> {route?.destination}
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Clock className="h-4 w-4" /> {schedule?.departureTime} → {schedule?.arrivalTime}
                </div>
              </div>
              <p className="text-sm text-gray-500">{new Date(schedule?.travelDate).toLocaleDateString('en-NP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <SeatMap seats={seatData?.seats || []} selectedSeats={selectedSeats} onSeatSelect={setSelectedSeats} maxSeats={6} />
          </div>

          {/* Booking summary panel */}
          <div>
            <div className="card sticky top-20 space-y-5">
              <h3 className="font-bold text-gray-800 text-lg">
                {isReturnLeg ? 'Return Journey' : isRoundTrip ? 'Outbound Journey' : 'Booking Summary'}
              </h3>

              {/* Outbound recap (shown on return leg) */}
              {isReturnLeg && outboundBooking && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm space-y-1">
                  <p className="text-xs font-semibold text-green-700 uppercase mb-1.5">✓ Outbound Selected</p>
                  <div className="flex justify-between"><span className="text-gray-500">Route</span><span className="font-medium">{outboundBooking.schedule?.route?.source} → {outboundBooking.schedule?.route?.destination}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{outboundBooking.schedule?.travelDate}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Seats</span><span className="font-medium">{outboundBooking.selectedSeats?.sort((a, b) => a - b).join(', ')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold text-primary-600">NPR {(parseFloat(outboundBooking.fare || 0) * outboundBooking.selectedSeats?.length).toFixed(0)}</span></div>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Route</span><span className="font-medium">{route?.source} → {route?.destination}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{schedule?.travelDate}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Departure</span><span className="font-medium">{schedule?.departureTime}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Bus</span><span className="font-medium">{bus?.type}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Selected Seats</span><span className="font-medium">{selectedSeats.length > 0 ? selectedSeats.sort((a, b) => a - b).join(', ') : '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Price/Seat</span><span className="font-medium">NPR {schedule?.fare}</span></div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">{isReturnLeg ? 'Return Total' : 'Total'}</span>
                  <span className="text-2xl font-extrabold text-primary-600">NPR {(parseFloat(schedule?.fare || 0) * selectedSeats.length).toFixed(0)}</span>
                </div>
                {selectedSeats.length > 0 && <p className="text-xs text-gray-400 mt-1">{selectedSeats.length} seat(s) × NPR {schedule?.fare}</p>}
                {isReturnLeg && outboundBooking && selectedSeats.length > 0 && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-gray-200">
                    <span className="text-sm font-bold text-gray-700">Grand Total</span>
                    <span className="text-lg font-extrabold text-nepal-blue">
                      NPR {((parseFloat(outboundBooking.fare || 0) * outboundBooking.selectedSeats?.length) + (parseFloat(schedule?.fare || 0) * selectedSeats.length)).toFixed(0)}
                    </span>
                  </div>
                )}
              </div>

              {schedule?.status !== 'scheduled' && schedule?.status !== 'boarding' && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" /> This schedule is {schedule?.status}
                </div>
              )}

              <button onClick={handleProceed} disabled={selectedSeats.length === 0}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {proceedLabel} <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-xs text-gray-400 text-center">🔒 Secure booking powered by Shubha Yatra</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
