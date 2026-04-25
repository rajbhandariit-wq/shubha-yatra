import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Bus, Clock, MapPin, Wifi, Wind, Zap, Star, Filter, ChevronDown, Search, AlertCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { customerAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AMENITY_ICONS = { WiFi: Wifi, AC: Wind, 'USB Charging': Zap };

export default function SearchResults() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const source = params.get('source') || '';
  const destination = params.get('destination') || '';
  const date = params.get('date') || '';
  const seats = params.get('seats') || 1;

  useEffect(() => {
    setLoading(true);
    customerAPI.searchBuses({ source, destination, date, seats })
      .then(r => setSchedules(r.data.schedules || []))
      .catch(() => toast.error('Failed to fetch buses'))
      .finally(() => setLoading(false));
  }, [source, destination, date]);

  const filtered = schedules.filter(s => filter === 'all' || s.bus?.type === filter);

  const busTypes = [...new Set(schedules.map(s => s.bus?.type))].filter(Boolean);

  const BusCard = ({ schedule }) => {
    const bus = schedule.bus;
    const route = schedule.route;
    const provider = bus?.provider;

    return (
      <div className="bg-white rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left - Bus info */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-nepal-blue to-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Bus className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-800">{bus?.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bus?.type==='AC'||bus?.type==='Sleeper'||bus?.type==='Deluxe'||bus?.type==='Super-Deluxe' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{bus?.type}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{provider?.companyName || provider?.name} • {bus?.registrationNumber}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {(bus?.amenities || []).slice(0,3).map(a => (
                  <span key={a} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    {a === 'WiFi' ? '📶' : a === 'AC' ? '❄️' : a === 'USB Charging' ? '🔌' : '✓'} {a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Center - Journey */}
          <div className="flex items-center gap-4 md:flex-1 md:justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{schedule.departureTime}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {route?.source}</p>
            </div>
            <div className="flex flex-col items-center text-gray-400 gap-1">
              <div className="flex items-center gap-1 text-xs"><Clock className="h-3 w-3" />{route?.estimatedDuration ? `${Math.floor(route.estimatedDuration/60)}h ${route.estimatedDuration%60}m` : '—'}</div>
              <div className="flex items-center gap-1"><div className="h-px w-12 bg-gray-200"/><ArrowRight className="h-4 w-4"/><div className="h-px w-12 bg-gray-200"/></div>
              <p className="text-xs">{schedule.availableSeats} seats left</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{schedule.arrivalTime}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {route?.destination}</p>
            </div>
          </div>

          {/* Right - Price & Book */}
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-3xl font-extrabold text-primary-600">NPR {schedule.fare}</p>
              <p className="text-xs text-gray-400">per person</p>
            </div>
            <div className="flex items-center gap-1 text-yellow-500 text-sm">
              <Star className="h-4 w-4 fill-yellow-400" /><Star className="h-4 w-4 fill-yellow-400" /><Star className="h-4 w-4 fill-yellow-400" /><Star className="h-4 w-4 fill-yellow-400" /><Star className="h-4 w-4" />
            </div>
            <button onClick={() => navigate(`/select-seats/${schedule.id}`, { state: { schedule } })} className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
              Select Seats <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      {/* Search header */}
      <div className="bg-gradient-to-r from-nepal-blue to-blue-700 text-white py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 text-xl font-bold mb-2">
            <MapPin className="h-5 w-5" />{source} <ArrowRight className="h-5 w-5" /> {destination}
          </div>
          <p className="text-blue-200 text-sm">{new Date(date).toLocaleDateString('en-NP', {weekday:'long',year:'numeric',month:'long',day:'numeric'})} • {seats} seat(s) • {filtered.length} bus{filtered.length!==1?'es':''} found</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex-1 w-full">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">Filter:</span>
          {['all', ...busTypes].map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${filter===t ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
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
            <h3 className="text-xl font-bold text-gray-600 mb-2">No buses found</h3>
            <p className="text-gray-400 mb-2">No buses available for {source} → {destination} on {date}</p>
            <p className="text-gray-400 font-nepali text-sm">यस मार्गमा बस उपलब्ध छैन</p>
            <Link to="/" className="btn-primary inline-flex items-center gap-2 mt-6"><Search className="h-4 w-4" /> Try Different Date</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(s => <BusCard key={s.id} schedule={s} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
