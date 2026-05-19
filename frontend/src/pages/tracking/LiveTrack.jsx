import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPublicTracking } from '../../services/api';
import { MapPin, Bus, Clock, RefreshCw, ChevronLeft, Navigation, Share2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

// Fix leaflet default icon paths broken by webpack/vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const busIcon = L.divIcon({
  className: '',
  html: `<div style="background:#DC143C;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:20px;">🚌</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function FlyToMarker({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 1 });
  }, [lat, lng, map]);
  return null;
}

const REFRESH_INTERVAL = 60 * 1000; // 60 seconds

export default function LiveTrack() {
  const { scheduleId } = useParams();
  const [schedule, setSchedule]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [countdown, setCountdown]   = useState(60);

  const fetchTracking = useCallback(async () => {
    try {
      const res = await getPublicTracking(scheduleId);
      setSchedule(res.data);
      setError(null);
      setLastRefresh(new Date());
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load tracking data');
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchTracking]);

  const shareLink = async () => {
    const url = window.location.href;
    const text = `Track live bus: ${schedule?.route?.source} → ${schedule?.route?.destination} | Shubha Yatra`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Live Bus Tracking', text, url });
      } catch {}
    } else {
      navigator.clipboard?.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  // Countdown ticker
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 60)), 1000);
    return () => clearInterval(t);
  }, [lastRefresh]);

  const loc = schedule?.driverLocation;
  const hasLocation = loc?.lat && loc?.lng;

  // Nepal default center if no location
  const defaultCenter = [28.3949, 84.1240];
  const center = hasLocation ? [loc.lat, loc.lng] : defaultCenter;

  const statusLabel = {
    not_started: { text: 'Not Yet Started',  color: 'bg-yellow-100 text-yellow-700' },
    in_progress:  { text: 'Live — In Progress', color: 'bg-green-100 text-green-700' },
    completed:    { text: 'Journey Completed',  color: 'bg-gray-100 text-gray-600'   },
  };
  const s = statusLabel[schedule?.journeyStatus] || statusLabel.not_started;

  const fmtTime = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading live tracking…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <MapPin size={48} className="text-gray-300 mb-4" />
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Tracking Unavailable</h2>
      <p className="text-gray-500 text-sm text-center mb-6">{error}</p>
      <Link to="/" className="text-red-600 hover:underline text-sm flex items-center gap-1">
        <ChevronLeft size={16} /> Back to Home
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-50 shadow-sm">
        <Link to="/" className="text-gray-500 hover:text-gray-700">
          <ChevronLeft size={22} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">
            {schedule?.route?.source} → {schedule?.route?.destination}
          </p>
          <p className="text-xs text-gray-400">{schedule?.bus?.name} · {schedule?.bus?.registrationNumber}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.color}`}>{s.text}</span>
        <button onClick={shareLink} className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" title="Share live link">
          <Share2 size={18} />
        </button>
      </div>

      {/* Map */}
      <div className="flex-1" style={{ minHeight: '55vh' }}>
        <MapContainer
          center={center}
          zoom={hasLocation ? 13 : 7}
          style={{ height: '100%', minHeight: '55vh', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasLocation && (
            <>
              <FlyToMarker lat={loc.lat} lng={loc.lng} />
              <Marker position={[loc.lat, loc.lng]} icon={busIcon}>
                <Popup>
                  <div className="text-sm">
                    <strong>{schedule.bus?.name}</strong><br />
                    {schedule.route?.source} → {schedule.route?.destination}<br />
                    {loc.speed != null && `Speed: ${Math.round((loc.speed || 0) * 3.6)} km/h`}
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>

      {/* Info panel */}
      <div className="bg-white border-t border-gray-100 px-4 py-4 space-y-3">
        {!hasLocation && schedule?.journeyStatus === 'not_started' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-sm text-yellow-700 flex items-center gap-2">
            <Clock size={15} /> Journey hasn't started yet — check back closer to departure time.
          </div>
        )}
        {!hasLocation && schedule?.journeyStatus === 'in_progress' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700 flex items-center gap-2">
            <Navigation size={15} /> Driver location not yet available — refreshing every minute.
          </div>
        )}
        {schedule?.journeyStatus === 'completed' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 flex items-center gap-2">
            <Bus size={15} /> This journey has been completed.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Departure</p>
            <p className="font-medium text-gray-800">{schedule?.departureTime}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Arrival</p>
            <p className="font-medium text-gray-800">{schedule?.arrivalTime}</p>
          </div>
          {schedule?.journeyStartedAt && (
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Started at</p>
              <p className="font-medium text-gray-800">{fmtTime(schedule.journeyStartedAt)}</p>
            </div>
          )}
          {loc?.updatedAt && (
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Location updated</p>
              <p className="font-medium text-gray-800">{fmtTime(loc.updatedAt)}</p>
            </div>
          )}
          {schedule?.delayMinutes > 0 && (
            <div className="col-span-2">
              <p className="text-orange-600 text-sm font-medium">⚠️ Delayed by {schedule.delayMinutes} min</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-400">Auto-refresh in {countdown}s</p>
          <button onClick={fetchTracking}
            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium">
            <RefreshCw size={13} /> Refresh now
          </button>
        </div>
      </div>
    </div>
  );
}
