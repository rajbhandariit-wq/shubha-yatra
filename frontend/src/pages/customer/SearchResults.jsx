import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeftRight, Bus, Clock, MapPin, Wifi, Wind, Zap, Star, Filter, Search, AlertCircle, ChevronLeft, ChevronRight, Navigation } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { customerAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { CATEGORY_META } from '../../utils/seatLayout';

const AMENITY_ICONS = { WiFi: Wifi, AC: Wind, 'USB Charging': Zap };

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function formatDateStrip(dateStr) {
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
    num: d.getDate(),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
  };
}

export default function SearchResults() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const source = params.get('source') || '';
  const destination = params.get('destination') || '';
  const date = params.get('date') || new Date().toISOString().split('T')[0];
  const tripType = params.get('tripType') || 'oneWay';
  const returnDate = params.get('returnDate') || '';
  const isRoundTrip = tripType === 'roundTrip' && !!returnDate;

  const [activeTab, setActiveTab] = useState('outbound');
  const [outboundSchedules, setOutboundSchedules] = useState([]);
  const [returnSchedules, setReturnSchedules] = useState([]);
  const [outboundLoading, setOutboundLoading] = useState(true);
  const [returnLoading, setReturnLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!source || !destination) { setOutboundLoading(false); return; }
    setOutboundLoading(true);
    customerAPI.searchBuses({ source, destination, date, seats: 1 })
      .then(r => setOutboundSchedules(r.data.schedules || []))
      .catch(() => { toast.error('Failed to fetch buses'); setOutboundSchedules([]); })
      .finally(() => setOutboundLoading(false));
  }, [source, destination, date]);

  useEffect(() => {
    if (!isRoundTrip || !source || !destination) { setReturnSchedules([]); return; }
    setReturnLoading(true);
    customerAPI.searchBuses({ source: destination, destination: source, date: returnDate, seats: 1 })
      .then(r => setReturnSchedules(r.data.schedules || []))
      .catch(() => setReturnSchedules([]))
      .finally(() => setReturnLoading(false));
  }, [isRoundTrip, source, destination, returnDate]);

  // Reset filter when switching tabs
  const switchTab = (tab) => { setActiveTab(tab); setFilter('all'); };

  const activeDate = activeTab === 'outbound' ? date : returnDate;
  const activeSchedules = activeTab === 'outbound' ? outboundSchedules : returnSchedules;
  const isLoading = activeTab === 'outbound' ? outboundLoading : returnLoading;

  const busTypes = [...new Set(activeSchedules.map(s => s.bus?.seatLayout?.busCategory || s.bus?.type))].filter(Boolean);
  const filtered = activeSchedules.filter(s => {
    if (filter === 'all') return true;
    const cat = s.bus?.seatLayout?.busCategory;
    return cat ? cat === filter : s.bus?.type === filter;
  });

  const goToDate = (newDateStr) => {
    const p = new URLSearchParams({ source, destination, date: activeTab === 'outbound' ? newDateStr : date });
    if (isRoundTrip) { p.set('tripType', 'roundTrip'); p.set('returnDate', activeTab === 'return' ? newDateStr : returnDate); }
    navigate(`/search?${p.toString()}`);
  };

  // Date strip: 3 days before, selected, 3 days after
  const dateStrip = Array.from({ length: 7 }, (_, i) => addDays(activeDate, i - 3));

  const BusCard = ({ schedule }) => {
    const bus = schedule.bus;
    const route = schedule.route;
    const provider = bus?.provider;
    const catKey = bus?.seatLayout?.busCategory;
    const cat = catKey ? CATEGORY_META[catKey] : null;
    return (
      <div className="bg-white rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-nepal-blue to-blue-600 rounded-2xl flex items-center justify-center shrink-0 text-2xl">
              {cat ? cat.icon : <Bus className="h-7 w-7 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-800">{bus?.name}</h3>
                {cat ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${cat.color}`}>
                    {cat.icon} {cat.label} Bus
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">{bus?.type}</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{provider?.companyName || provider?.name} • {bus?.registrationNumber}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {(bus?.amenities || []).slice(0, 3).map(a => (
                  <span key={a} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    {a === 'WiFi' ? '📶' : a === 'AC' ? '❄️' : a === 'USB Charging' ? '🔌' : '✓'} {a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 md:flex-1 md:justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{schedule.departureTime}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {route?.source}</p>
            </div>
            <div className="flex flex-col items-center text-gray-400 gap-1">
              <div className="flex items-center gap-1 text-xs"><Clock className="h-3 w-3" />{route?.estimatedDuration ? `${Math.floor(route.estimatedDuration / 60)}h ${route.estimatedDuration % 60}m` : '—'}</div>
              <div className="flex items-center gap-1"><div className="h-px w-12 bg-gray-200" /><ArrowRight className="h-4 w-4" /><div className="h-px w-12 bg-gray-200" /></div>
              <p className="text-xs">{schedule.availableSeats} seats left</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{schedule.arrivalTime}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {route?.destination}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-3xl font-extrabold text-primary-600">NPR {schedule.fare}</p>
              <p className="text-xs text-gray-400">per person</p>
            </div>
            <div className="flex items-center gap-1 text-yellow-500 text-sm">
              {[1, 2, 3, 4, 5].map(n => <Star key={n} className={`h-4 w-4 ${n <= 4 ? 'fill-yellow-400' : ''}`} />)}
            </div>
            {schedule.journeyStatus === 'in_progress' && (
              <Link to={`/track/${schedule.id}`} target="_blank"
                className="flex items-center gap-1.5 text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                <Navigation className="h-4 w-4" /> Live Track
              </Link>
            )}
            <button onClick={() => {
              const navState = { schedule };
              if (isRoundTrip && activeTab === 'outbound') {
                navState.roundTripContext = { returnDate, source, destination };
              }
              navigate(`/select-seats/${schedule.id}`, { state: navState });
            }} className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
              {isRoundTrip && activeTab === 'outbound' ? 'Select Outbound Seats' : 'Select Seats'} <ArrowRight className="h-4 w-4" />
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
      <div className="bg-gradient-to-r from-nepal-blue to-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-0">
          {/* Route display */}
          <div className="flex items-center gap-3 text-xl font-bold mb-1">
            <MapPin className="h-5 w-5 shrink-0" />
            {isRoundTrip ? (
              <>
                <span>{source}</span><ArrowLeftRight className="h-5 w-5" /><span>{destination}</span>
                <span className="text-base font-normal text-blue-200 ml-2">Round Trip</span>
              </>
            ) : (
              <><span>{source}</span><ArrowRight className="h-5 w-5" /><span>{destination}</span></>
            )}
          </div>

          {/* Round trip tab bar */}
          {isRoundTrip && (
            <div className="flex gap-1 mt-3">
              <button onClick={() => switchTab('outbound')}
                className={`px-5 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'outbound' ? 'bg-white text-nepal-blue' : 'text-blue-200 hover:text-white'}`}>
                <ArrowRight className="h-3.5 w-3.5 inline mr-1.5" />
                Outbound · {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {outboundSchedules.length > 0 && <span className="ml-1.5 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">{outboundSchedules.length}</span>}
              </button>
              <button onClick={() => switchTab('return')}
                className={`px-5 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'return' ? 'bg-white text-nepal-blue' : 'text-blue-200 hover:text-white'}`}>
                <ArrowRight className="h-3.5 w-3.5 inline mr-1.5 rotate-180" />
                Return · {new Date(returnDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {returnSchedules.length > 0 && <span className="ml-1.5 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">{returnSchedules.length}</span>}
              </button>
            </div>
          )}
        </div>

        {/* ±3 days date strip */}
        <div className={`${isRoundTrip && activeTab === 'outbound' ? 'bg-white' : isRoundTrip ? 'bg-white' : 'bg-white/10'} ${isRoundTrip ? 'border-t border-gray-100' : ''}`}>
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
              <button onClick={() => goToDate(addDays(activeDate, -1))} className={`shrink-0 p-1.5 rounded-lg transition-colors ${isRoundTrip ? 'text-gray-400 hover:text-primary-600 hover:bg-gray-100' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              {dateStrip.map((d) => {
                const isSelected = d === activeDate;
                const fmt = formatDateStrip(d);
                return (
                  <button key={d} onClick={() => goToDate(d)}
                    className={`shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl text-center transition-all min-w-[56px] ${
                      isSelected
                        ? 'bg-primary-600 text-white shadow-md'
                        : isRoundTrip
                          ? 'text-gray-600 hover:bg-gray-100'
                          : 'text-white/70 hover:bg-white/15 hover:text-white'
                    }`}>
                    <span className="text-xs font-medium">{fmt.day}</span>
                    <span className="text-base font-bold leading-tight">{fmt.num}</span>
                    <span className="text-xs opacity-75">{fmt.month}</span>
                  </button>
                );
              })}
              <button onClick={() => goToDate(addDays(activeDate, 1))} className={`shrink-0 p-1.5 rounded-lg transition-colors ${isRoundTrip ? 'text-gray-400 hover:text-primary-600 hover:bg-gray-100' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Result count (one-way only, round trip has tab) */}
        {!isRoundTrip && (
          <div className="max-w-5xl mx-auto px-4 pb-4">
            <p className="text-blue-200 text-sm">{filtered.length} bus{filtered.length !== 1 ? 'es' : ''} found</p>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex-1 w-full">
        {/* Bus type filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">Filter:</span>
          {['all', ...busTypes].map(t => {
            const m = CATEGORY_META[t];
            return (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${filter === t ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
                {t === 'all' ? 'All Buses' : m ? `${m.icon} ${m.label}` : t}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent" />
            <p className="text-gray-500 font-nepali">खोजी गर्दैछौं...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No buses found</h3>
            <p className="text-gray-400 mb-1">
              {activeTab === 'return'
                ? `No buses available for ${destination} → ${source} on ${returnDate}`
                : `No buses available for ${source} → ${destination} on ${date}`}
            </p>
            <p className="text-gray-400 text-sm mb-2">Try a different date using the date strip above</p>
            <p className="text-gray-400 font-nepali text-sm">यस मार्गमा बस उपलब्ध छैन</p>
            <Link to="/" className="btn-primary inline-flex items-center gap-2 mt-6"><Search className="h-4 w-4" /> New Search</Link>
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
