import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, Calendar, ArrowRight, ArrowLeftRight, Star, Shield, Clock, Headphones } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

const NEPAL_LANDMARKS = [
  { slug: 'kathmandu',    name: 'Kathmandu',    url: '/images/indra-Jatra-1.jpg' },
  { slug: 'pokhara',     name: 'Pokhara',      url: '/images/Annapurna.jpg' },
  { slug: 'lumbini',     name: 'Lumbini',      url: '/images/Lumbini.jpg' },
  { slug: 'pashupatinath', name: 'Pashupatinath', url: '/images/Pashupatinath.jpg' },
  { slug: 'langtang',    name: 'Langtang',     url: '/images/Langtang.jpg' },
  { slug: 'swayambhu',   name: 'Swayambhu',    url: '/images/Swayambhu.jpg' },
];

const NEPAL_CITIES = ['Kathmandu','Pokhara','Chitwan','Lumbini','Butwal','Nepalgunj','Dharan','Biratnagar','Janakpur','Bhairahawa','Birgunj','Hetauda','Dhangadhi','Illam','Tansen','Mustang'];

const todayStr = new Date().toISOString().split('T')[0];

export default function Home() {
  const navigate = useNavigate();
  const [bgIdx, setBgIdx] = useState(0);
  const [form, setForm] = useState({ source: '', destination: '', date: todayStr, tripType: 'oneWay', returnDate: '' });
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [srcSuggest, setSrcSuggest] = useState([]);
  const [dstSuggest, setDstSuggest] = useState([]);

  const isValidCity = (city) => NEPAL_CITIES.includes(city);
  const isSearchValid =
    isValidCity(form.source) && isValidCity(form.destination) &&
    form.source !== form.destination && form.source.trim() !== '' && form.destination.trim() !== '' &&
    (form.tripType === 'oneWay' || (form.returnDate && form.returnDate >= form.date));

  useEffect(() => {
    const t = setInterval(() => setBgIdx(i => (i + 1) % NEPAL_LANDMARKS.length), 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    customerAPI.getPopularRoutes().then(r => setPopularRoutes(r.data.routes || [])).catch(() => {});
  }, []);

  const filterCities = (q) => q.length < 1 ? [] : NEPAL_CITIES.filter(c => c.toLowerCase().startsWith(q.toLowerCase()));

  const handleSearch = (e) => {
    e.preventDefault();
    if (!form.source || !form.destination) return toast.error('Please enter source and destination');
    if (form.source === form.destination) return toast.error('Source and destination cannot be same');
    if (form.tripType === 'roundTrip' && !form.returnDate) return toast.error('Please select a return date');
    const p = new URLSearchParams({ source: form.source, destination: form.destination, date: form.date });
    if (form.tripType === 'roundTrip') { p.set('tripType', 'roundTrip'); p.set('returnDate', form.returnDate); }
    navigate(`/search?${p.toString()}`);
  };

  const swapCities = () => setForm(f => ({ ...f, source: f.destination, destination: f.source }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        {NEPAL_LANDMARKS.map((lm, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-2000 ${i === bgIdx ? 'opacity-100' : 'opacity-0'}`}>
            <img src={lm.url} alt={lm.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>
        ))}

        <div className="absolute inset-0 flex items-end justify-end pointer-events-none">
          <div className="mb-6 mr-6 text-white/20 text-right">
            <p className="text-6xl font-nepali font-bold">शुभ यात्रा</p>
            <p className="text-xl">Nepal's Journey Awaits</p>
          </div>
        </div>


        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {NEPAL_LANDMARKS.map((_, i) => (
            <button key={i} onClick={() => setBgIdx(i)} className={`h-2 rounded-full transition-all ${i === bgIdx ? 'bg-white w-6' : 'bg-white/40 w-2'}`} />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-nepal-red/90 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm mb-4">
              <span className="animate-pulse w-2 h-2 bg-white rounded-full" />
              Nepal's #1 Bus Booking Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-3 leading-tight drop-shadow-lg">
              Your Safe Journey<br />
              <span className="text-nepal-red drop-shadow-none" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.3)' }}>Starts Here</span>
            </h1>
            <p className="text-xl text-white/90 font-nepali mb-2">शुभ यात्रा — नेपालभर सुरक्षित यात्रा</p>
            <p className="text-white/70">Book bus tickets across Nepal — Fast, Easy, Reliable</p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 max-w-4xl mx-auto">
            {/* Trip type toggle */}
            <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => setForm(f => ({ ...f, tripType: 'oneWay', returnDate: '' }))}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${form.tripType === 'oneWay' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
                <ArrowRight className="h-3.5 w-3.5" /> One Way
              </button>
              <button type="button" onClick={() => setForm(f => ({ ...f, tripType: 'roundTrip' }))}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${form.tripType === 'roundTrip' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
                <ArrowLeftRight className="h-3.5 w-3.5" /> Round Trip
              </button>
            </div>

            <div className={`grid grid-cols-1 gap-4 ${form.tripType === 'roundTrip' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
              {/* Source */}
              <div className="relative">
                <label className="label text-gray-700">From • यहाँबाट</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nepal-red" />
                  <input value={form.source} onChange={e => { setForm(f => ({ ...f, source: e.target.value })); setSrcSuggest(filterCities(e.target.value)); }}
                    className="input-field pl-9 text-sm" placeholder="Kathmandu..." autoComplete="off" />
                </div>
                {srcSuggest.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {srcSuggest.map(c => <button key={c} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 hover:text-primary-600" onClick={() => { setForm(f => ({ ...f, source: c })); setSrcSuggest([]); }}>{c}</button>)}
                  </div>
                )}
                {form.source && !isValidCity(form.source) && <p className="text-xs text-red-500 mt-1">Invalid city</p>}
              </div>

              {/* Swap + Destination */}
              <div className="relative">
                <label className="label text-gray-700">To • त्यहाँसम्म</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nepal-blue" />
                  <input value={form.destination} onChange={e => { setForm(f => ({ ...f, destination: e.target.value })); setDstSuggest(filterCities(e.target.value)); }}
                    className="input-field pl-9 pr-9 text-sm" placeholder="Pokhara..." autoComplete="off" />
                  <button type="button" onClick={swapCities} title="Swap cities"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors">
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                {dstSuggest.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {dstSuggest.map(c => <button key={c} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 hover:text-primary-600" onClick={() => { setForm(f => ({ ...f, destination: c })); setDstSuggest([]); }}>{c}</button>)}
                  </div>
                )}
                {form.destination && !isValidCity(form.destination) && <p className="text-xs text-red-500 mt-1">Invalid city</p>}
              </div>

              {/* Depart Date */}
              <div>
                <label className="label text-gray-700">{form.tripType === 'roundTrip' ? 'Depart • जाने' : 'Date • मिति'}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="date" value={form.date} min={todayStr}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value, returnDate: f.returnDate && f.returnDate < e.target.value ? e.target.value : f.returnDate }))}
                    className="input-field pl-9 text-sm" />
                </div>
              </div>

              {/* Return Date (round trip only) */}
              {form.tripType === 'roundTrip' && (
                <div>
                  <label className="label text-gray-700">Return • फर्कने</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-500" />
                    <input type="date" value={form.returnDate} min={form.date || todayStr}
                      onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))}
                      className="input-field pl-9 text-sm" />
                  </div>
                </div>
              )}

              {/* Search Button */}
              <div className="flex items-end">
                <button type="submit" disabled={!isSearchValid}
                  className={`btn-primary w-full flex items-center justify-center gap-2 text-sm h-[42px] ${!isSearchValid ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Search className="h-4 w-4" /> Search
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Why Choose Shubha Yatra?</h2>
            <p className="text-gray-500 mt-2 font-nepali">हामीलाई किन छान्ने?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Safe & Secure', desc: 'Verified bus operators. Your safety is our priority.', nepali: 'सुरक्षित यात्रा', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Clock, title: 'Real-time Tracking', desc: 'Live seat availability. Instant booking confirmation.', nepali: 'तत्काल बुकिङ', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: Star, title: 'Best Prices', desc: 'Competitive fares. No hidden charges ever.', nepali: 'उचित मूल्य', color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { icon: Headphones, title: '24/7 Support', desc: 'Round-the-clock customer service. Always here for you.', nepali: 'सहायता सेवा', color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(({ icon: Icon, title, desc, nepali, color, bg }) => (
              <div key={title} className="text-center p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className={`${bg} w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon className={`h-7 w-7 ${color}`} />
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
                <p className="text-gray-500 text-sm mb-1">{desc}</p>
                <p className={`text-xs font-nepali ${color}`}>{nepali}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 flex items-end justify-center pointer-events-none opacity-5">
          <svg viewBox="0 0 1200 300" className="w-full" fill="#003893">
            <polygon points="0,300 150,100 250,180 350,80 450,160 550,60 650,140 750,50 850,130 950,70 1050,150 1150,90 1200,300" />
          </svg>
        </div>
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Popular Routes</h2>
            <p className="text-gray-500 mt-2 font-nepali">लोकप्रिय मार्गहरू</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(popularRoutes.length > 0 ? popularRoutes : [
              { source: 'Kathmandu', destination: 'Pokhara', fare: 800 }, { source: 'Kathmandu', destination: 'Chitwan', fare: 600 },
              { source: 'Pokhara', destination: 'Lumbini', fare: 700 }, { source: 'Kathmandu', destination: 'Birgunj', fare: 750 },
              { source: 'Pokhara', destination: 'Biratnagar', fare: 1500 }, { source: 'Kathmandu', destination: 'Nepalgunj', fare: 1200 },
            ]).map((r, i) => (
              <button key={i} onClick={() => navigate(`/search?source=${r.source}&destination=${r.destination}&date=${form.date}`)}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-400 hover:shadow-md transition-all group text-left">
                <div>
                  <div className="flex items-center gap-2 text-gray-800 font-semibold">
                    <span>{r.source}</span><ArrowRight className="h-4 w-4 text-primary-500" /><span>{r.destination}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Daily service available</p>
                </div>
                <div className="text-right">
                  <p className="text-primary-600 font-bold">NPR {r.fare}</p>
                  <p className="text-xs text-gray-400">onwards</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Nepal Landmarks Gallery */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800">Explore Nepal</h2>
            <p className="text-gray-500 mt-2 font-nepali">नेपाल अन्वेषण गर्नुहोस्</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="explore">
            {NEPAL_LANDMARKS.map((lm, i) => (
              <Link key={i} to={`/explore/${lm.slug}`} className="relative rounded-2xl overflow-hidden h-52 group cursor-pointer block">
                <img src={lm.url} alt={lm.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.parentElement.style.background = 'linear-gradient(135deg, #003893, #DC143C)'; e.target.style.display = 'none'; }} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-gradient-to-r from-nepal-blue to-blue-800 text-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: '50+', label: 'Bus Operators', nepali: 'बस अपरेटर' },
              { num: '200+', label: 'Daily Routes', nepali: 'दैनिक मार्ग' },
              { num: '10K+', label: 'Happy Travelers', nepali: 'खुसी यात्री' },
              { num: '25+', label: 'Districts', nepali: 'जिल्लाहरू' },
            ].map(({ num, label, nepali }) => (
              <div key={label}>
                <p className="text-4xl font-extrabold text-white mb-1">{num}</p>
                <p className="text-blue-200 font-medium">{label}</p>
                <p className="text-blue-300/70 text-sm font-nepali">{nepali}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
