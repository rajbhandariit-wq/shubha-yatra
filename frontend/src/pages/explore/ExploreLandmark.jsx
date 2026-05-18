import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, ArrowRight, Clock, Mountain, Star, Bus } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const LANDMARKS = {
  kathmandu: {
    name: 'Kathmandu',
    nepali: 'काठमाडौं',
    image: '/images/indra-Jatra-1.jpg',
    tagline: 'The City of Temples',
    description: [
      'Kathmandu, the capital city of Nepal, is a vibrant metropolis nestled in a valley at 1,400 metres above sea level. Home to over 1.5 million people, it is the cultural, political, and economic heart of Nepal.',
      'The city is famous for its UNESCO World Heritage Sites including Pashupatinath Temple, Boudhanath Stupa, Swayambhunath, and the historic Kathmandu Durbar Square. Every alley reveals centuries of history, art, and living tradition.',
      'The Indra Jatra festival — one of Nepal\'s grandest — takes place in Kathmandu\'s old city each September, filling the streets with processions, masked dances, and the chariot of the living goddess Kumari.',
    ],
    highlights: ['7 UNESCO World Heritage Sites', 'Kathmandu Durbar Square', 'Boudhanath Stupa', 'Thamel entertainment district', 'Asan Bazaar', 'Garden of Dreams'],
    bestTime: 'October – December, March – May',
    altitude: '1,400 m',
    nearCity: 'Kathmandu',
    busFrom: ['Pokhara', 'Chitwan', 'Birgunj', 'Nepalgunj', 'Biratnagar'],
  },
  pokhara: {
    name: 'Pokhara',
    nepali: 'पोखरा',
    image: '/images/Annapurna.jpg',
    tagline: 'The Gateway to the Himalayas',
    description: [
      'Pokhara is Nepal\'s second-largest city and one of the most beautiful destinations in all of Asia. Situated at 827 metres on the shores of Phewa Lake, the city offers breathtaking views of the Annapurna range, including the iconic fishtail peak of Machhapuchhre.',
      'The city is the starting point for some of the world\'s most famous trekking routes, including the Annapurna Circuit and Annapurna Base Camp trek. It is also a hub for adventure sports — paragliding from Sarangkot is among the top experiences in Nepal.',
      'The relaxed lakeside atmosphere, international restaurants, and stunning mountain vistas make Pokhara a favourite for both trekkers and travellers seeking rest and inspiration.',
    ],
    highlights: ['Phewa Lake boat rides', 'Sarangkot sunrise viewpoint', 'Annapurna Base Camp treks', 'Paragliding', 'Davis Falls', 'Gupteshwor Cave'],
    bestTime: 'October – November, March – April',
    altitude: '827 m',
    nearCity: 'Pokhara',
    busFrom: ['Kathmandu', 'Lumbini', 'Butwal', 'Biratnagar'],
  },
  lumbini: {
    name: 'Lumbini',
    nepali: 'लुम्बिनी',
    image: '/images/Lumbini.jpg',
    tagline: 'The Birthplace of Lord Buddha',
    description: [
      'Lumbini is one of the holiest places on earth — the birthplace of Siddhartha Gautama, who became the Buddha, the Enlightened One, around 563 BCE. Located in the Terai plains of southern Nepal, it is a UNESCO World Heritage Site and a major pilgrimage destination for Buddhists worldwide.',
      'The Sacred Garden contains the Maya Devi Temple, marking the exact spot of the Buddha\'s birth. Nearby stands the Ashoka Pillar, erected by Emperor Ashoka in 249 BCE — one of the oldest inscriptions in South Asia.',
      'The Lumbini Development Zone encompasses dozens of monasteries built by Buddhist nations from around the world, each in their own architectural style, making Lumbini a remarkable international spiritual landscape.',
    ],
    highlights: ['Maya Devi Temple', 'Ashoka Pillar (249 BCE)', 'Sacred Pond (Puskarini)', 'International Monastery Zone', 'Lumbini Museum', 'World Peace Pagoda'],
    bestTime: 'October – March',
    altitude: '100 m',
    nearCity: 'Bhairahawa',
    busFrom: ['Kathmandu', 'Pokhara', 'Butwal', 'Nepalgunj'],
  },
  pashupatinath: {
    name: 'Pashupatinath',
    nepali: 'पशुपतिनाथ',
    image: '/images/Pashupatinath.jpg',
    tagline: 'The Sacred Temple of Lord Shiva',
    description: [
      'Pashupatinath Temple is the most sacred Hindu temple in Nepal and one of the most important Shiva shrines in the world. Located on the banks of the holy Bagmati River in Kathmandu, it is a UNESCO World Heritage Site and a living centre of Hindu worship.',
      'The temple complex, dating back to at least the 5th century CE, encompasses hundreds of smaller shrines, ashrams, statues, and cremation ghats. The evening Aarti ceremony on the Bagmati ghats is a deeply moving spiritual experience.',
      'During Maha Shivaratri in February-March, hundreds of thousands of pilgrims and sadhus gather here from across Nepal and India, transforming the area into an extraordinary festival of faith.',
    ],
    highlights: ['Main Pashupatinath Temple', 'Bagmati River ghats', 'Evening Aarti ceremony', 'Maha Shivaratri festival', '492 temples and monuments', 'Sadhus and holy men'],
    bestTime: 'October – March (Maha Shivaratri: Feb–Mar)',
    altitude: '1,300 m',
    nearCity: 'Kathmandu',
    busFrom: ['Pokhara', 'Chitwan', 'Birgunj', 'Nepalgunj'],
  },
  langtang: {
    name: 'Langtang',
    nepali: 'लंगताङ',
    image: '/images/Langtang.jpg',
    tagline: 'The Valley Closest to the Sky',
    description: [
      'Langtang Valley is one of Nepal\'s most spectacular trekking destinations, located just 50 km north of Kathmandu in Langtang National Park. Often called "the valley closest to the sky," it offers dramatic Himalayan scenery without the long approach trek required for Everest or Annapurna.',
      'The Langtang region is home to the Tamang people, whose culture, monasteries, and yak-cheese farms provide a rich cultural experience alongside the natural beauty. Kyanjin Gompa, a small monastery at 3,870 metres, is the spiritual heart of the valley.',
      'The area was heavily affected by the 2015 earthquake but has since been rebuilt with remarkable resilience. Trekking here directly supports the local communities working to restore their livelihoods and culture.',
    ],
    highlights: ['Langtang National Park', 'Kyanjin Gompa monastery', 'Langtang Lirung peak views', 'Tamang Heritage Trail', 'Traditional yak cheese farms', 'Gosainkunda Lake'],
    bestTime: 'March – May, October – December',
    altitude: '3,500 m (valley)',
    nearCity: 'Kathmandu',
    busFrom: ['Pokhara', 'Chitwan', 'Birgunj'],
  },
  swayambhu: {
    name: 'Swayambhu',
    nepali: 'स्वयम्भु',
    image: '/images/Swayambhu.jpg',
    tagline: 'The Monkey Temple on the Hill',
    description: [
      'Swayambhunath Stupa — popularly known as the Monkey Temple — is one of the oldest and most recognisable religious sites in Nepal. Perched on a hilltop overlooking the Kathmandu Valley, the stupa is believed to be over 2,500 years old, making it one of the oldest Buddhist monuments in the world.',
      'The all-seeing eyes of the Buddha painted on the four sides of the golden spire are an iconic symbol of Nepal, seen on everything from paintings to postage stamps. The hill is also home to numerous smaller shrines, temples, and vajra sculptures.',
      'The resident monkey population has earned the stupa its affectionate nickname. Climbing the 365 steps to the top rewards visitors with panoramic views over Kathmandu Valley and a profound sense of spiritual calm.',
    ],
    highlights: ['Ancient Buddhist stupa (2,500+ years)', 'All-seeing Eyes of Buddha', 'Panoramic valley views', 'Harati Devi Temple', 'Tibetan monastery', '365 stone steps'],
    bestTime: 'October – March',
    altitude: '1,400 m',
    nearCity: 'Kathmandu',
    busFrom: ['Pokhara', 'Chitwan', 'Birgunj', 'Nepalgunj'],
  },
};

export default function ExploreLandmark() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const lm = LANDMARKS[slug];

  if (!lm) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-500">
          <p className="text-xl font-semibold">Destination not found</p>
          <Link to="/" className="btn-primary px-6 py-2">Back to Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="relative h-[60vh] overflow-hidden">
        <img src={lm.image} alt={lm.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-5xl mx-auto">
          <p className="text-blue-200 text-sm uppercase tracking-widest mb-1">{lm.tagline}</p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg">{lm.name}</h1>
          <p className="text-2xl font-nepali text-white/70 mt-1">{lm.nepali}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {lm.description.map((para, i) => (
              <p key={i} className="text-gray-700 leading-relaxed">{para}</p>
            ))}

            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" /> Highlights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lm.highlights.map(h => (
                  <div key={h} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-800">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    {h}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Info card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
              <h3 className="font-bold text-gray-800">Travel Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-primary-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Best Time to Visit</p>
                    <p className="font-medium text-gray-700">{lm.bestTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mountain className="h-4 w-4 text-primary-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Altitude</p>
                    <p className="font-medium text-gray-700">{lm.altitude}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-primary-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Nearest Bus Stop</p>
                    <p className="font-medium text-gray-700">{lm.nearCity}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Book bus */}
            <div className="bg-gradient-to-br from-nepal-blue to-blue-700 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Bus className="h-5 w-5" />
                <h3 className="font-bold">Book a Bus Here</h3>
              </div>
              <p className="text-blue-200 text-xs mb-4">Direct buses available from:</p>
              <div className="space-y-2">
                {lm.busFrom.map(city => (
                  <button key={city}
                    onClick={() => navigate(`/search?source=${city}&destination=${lm.nearCity}&date=${new Date().toISOString().split('T')[0]}`)}
                    className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm transition-colors">
                    <span>{city} → {lm.nearCity}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Back link */}
            <Link to="/#explore" className="block text-center text-sm text-primary-600 hover:underline">
              ← Back to Explore Nepal
            </Link>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
