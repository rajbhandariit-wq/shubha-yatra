import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Bus, MapPin, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SeatMap from '../../components/SeatMap';
import { customerAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function SeatSelection() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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
    navigate('/payment', { state: { scheduleId, selectedSeats, schedule: seatData?.schedule, fare: seatData?.schedule?.fare } });
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col"><Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center"><div className="animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent mx-auto mb-3" /><p className="text-gray-500 font-nepali">सिट लोड हुँदैछ...</p></div>
      </div>
    </div>
  );

  const schedule = seatData?.schedule;
  const route = schedule?.route;
  const bus = schedule?.bus;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-nepal-blue to-blue-700 text-white py-6">
        <div className="max-w-5xl mx-auto px-4">
          <Link to="/search" className="flex items-center gap-2 text-blue-200 hover:text-white mb-3 text-sm"><ArrowLeft className="h-4 w-4" /> Back to results</Link>
          <div className="flex items-center gap-3">
            <Bus className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">{bus?.name} — {bus?.type}</h1>
              <p className="text-blue-200 text-sm">{bus?.registrationNumber} • {bus?.provider?.companyName}</p>
            </div>
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
                <div className="flex items-center gap-1 text-gray-500 text-sm"><Clock className="h-4 w-4" /> {schedule?.departureTime} → {schedule?.arrivalTime}</div>
              </div>
              <p className="text-sm text-gray-500">{new Date(schedule?.travelDate).toLocaleDateString('en-NP', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</p>
            </div>
            <SeatMap seats={seatData?.seats || []} selectedSeats={selectedSeats} onSeatSelect={setSelectedSeats} maxSeats={6} />
          </div>

          {/* Booking summary */}
          <div>
            <div className="card sticky top-20">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Booking Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Route</span><span className="font-medium">{route?.source} → {route?.destination}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span><span className="font-medium">{schedule?.travelDate}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Departure</span><span className="font-medium">{schedule?.departureTime}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Bus Type</span><span className="font-medium">{bus?.type}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Selected Seats</span><span className="font-medium">{selectedSeats.length > 0 ? selectedSeats.sort((a,b)=>a-b).join(', ') : '—'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Price/Seat</span><span className="font-medium">NPR {schedule?.fare}</span></div>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total Amount</span>
                  <span className="text-2xl font-extrabold text-primary-600">NPR {(parseFloat(schedule?.fare || 0) * selectedSeats.length).toFixed(0)}</span>
                </div>
                {selectedSeats.length > 0 && <p className="text-xs text-gray-400 mt-1">{selectedSeats.length} seat(s) × NPR {schedule?.fare}</p>}
              </div>

              {schedule?.status !== 'scheduled' && schedule?.status !== 'boarding' && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" /> This schedule is {schedule?.status}
                </div>
              )}

              <button onClick={handleProceed} disabled={selectedSeats.length === 0} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                Proceed to Payment <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">🔒 Secure payment powered by Shubha Yatra</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
