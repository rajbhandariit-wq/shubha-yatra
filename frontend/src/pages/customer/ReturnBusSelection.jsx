import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bus, Clock, MapPin, Star, AlertCircle, Wifi, Wind, Zap } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { customerAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ReturnBusSelection() {
  const navigate = useNavigate();
  const location = useLocation();

  const { roundTripContext, outboundBooking } = location.state || {};
  const { returnDate, source, destination } = roundTripContext || {};

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!destination || !source || !returnDate) { setLoading(false); return; }
    customerAPI.searchBuses({ source: destination, destination: source, date: returnDate, seats: 1 })
      .then(r => setSchedules(r.data.schedules || []))
      .catch(() => { toast.error('Failed to load return buses'); setSchedules([]); })
      .finally(() => setLoading(false));
  }, [source, destination, returnDate]);

  if (!roundTripContext || !outboundBooking) {
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

  const busTypes = [...new Set(schedules.map(s => s.bus?.type))].filter(Boolean);
  const filtered = schedules.filter(s => filter === 'all' || s.bus?.type === filter);

  const outboundTotal = (parseFloat(outboundBooking.fare || 0) * outboundBooking.selectedSeats?.length).toFixed(0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-200 hover:text-white mb-3 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to outbound seat selection
          </button>

          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/40 mb-3">
            ↩ Return Journey — Step 2 of 2
          </div>

          <div className="flex items-center gap-3 text-xl font-bold mb-1">
            <MapPin className="h-5 w-5 shrink-0" />
            <span>{destination}</span><ArrowRight className="h-5 w-5" /><span>{source}</span>
          </div>
          <p className="text-blue-200 text-sm">
            {new Date(returnDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}{filtered.length} bus{filtered.length !== 1 ? 'es' : ''} found
          </p>
        </div>

        {/* Outbound recap banner */}
        <div className="bg-white/10 border-t border-white/20">
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-blue-100 font-medium">✓ Outbound booked:</span>
            <span className="text-white">{outboundBooking.schedule?.route?.source} → {outboundBooking.schedule?.route?.destination}</span>
            <span className="text-blue-200">{outboundBooking.schedule?.travelDate} · {outboundBooking.schedule?.departureTime}</span>
            <span className="text-white font-semibold">Seats {outboundBooking.selectedSeats?.sort((a, b) => a - b).join(', ')}</span>
            <span className="ml-auto text-white font-bold">NPR {outboundTotal}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex-1 w-full">
        {/* Progress stepper */}
        <div className="flex items-center gap-1 text-xs mb-6">
          {['Search', 'Outbound Seats', 'Return Seats', 'Review', 'Payment'].map((step, i) => (
            <div key={step} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${i < 2 ? 'bg-primary-500 text-white' : i === 2 ? 'bg-nepal-blue text-white' : 'bg-gray-200 text-gray-400'}`}>{i + 1}</div>
              <span className={i === 2 ? 'text-nepal-blue font-semibold' : i < 2 ? 'text-primary-500' : 'text-gray-400'}>{step}</span>
              {i < 4 && <div className={`h-px w-4 sm:w-8 ${i < 2 ? 'bg-primary-300' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Bus type filter */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-sm text-gray-600 font-medium">Filter:</span>
          {['all', ...busTypes].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${filter === t ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
              {t === 'all' ? 'All Buses' : t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent" />
            <p className="text-gray-500 font-nepali">खोजी गर्दैछौं...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No return buses found</h3>
            <p className="text-gray-400 mb-1">{destination} → {source} on {returnDate}</p>
            <p className="text-gray-400 text-sm">Try searching with a different return date.</p>
            <Link to="/" className="btn-primary inline-flex items-center gap-2 mt-6">New Search</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(schedule => {
              const bus = schedule.bus;
              const route = schedule.route;
              const provider = bus?.provider;
              return (
                <div key={schedule.id} className="bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Bus className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-800">{bus?.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700">{bus?.type}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{provider?.companyName || provider?.name} • {bus?.registrationNumber}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {(bus?.amenities || []).slice(0, 3).map(a => (
                            <span key={a} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                              {a === 'WiFi' ? '📶' : a === 'AC' ? '❄️' : a === 'USB Charging' ? '🔌' : '✓'} {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:flex-1 md:justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800">{schedule.departureTime}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{route?.source}</p>
                      </div>
                      <div className="flex flex-col items-center text-gray-400 gap-1">
                        <div className="flex items-center gap-1 text-xs"><Clock className="h-3 w-3" />{route?.estimatedDuration ? `${Math.floor(route.estimatedDuration / 60)}h ${route.estimatedDuration % 60}m` : '—'}</div>
                        <div className="flex items-center gap-1"><div className="h-px w-12 bg-gray-200" /><ArrowRight className="h-4 w-4" /><div className="h-px w-12 bg-gray-200" /></div>
                        <p className="text-xs">{schedule.availableSeats} seats left</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800">{schedule.arrivalTime}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{route?.destination}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-3xl font-extrabold text-primary-600">NPR {schedule.fare}</p>
                        <p className="text-xs text-gray-400">per person</p>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500 text-sm">
                        {[1,2,3,4,5].map(n => <Star key={n} className={`h-4 w-4 ${n <= 4 ? 'fill-yellow-400' : ''}`} />)}
                      </div>
                      <button
                        onClick={() => navigate(`/select-seats/${schedule.id}`, {
                          state: { schedule, isReturnLeg: true, outboundBooking }
                        })}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-5 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors">
                        Select Return Seats <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
