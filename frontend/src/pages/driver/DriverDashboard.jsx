import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Play, Square, RefreshCw, Navigation, LogOut, Bus, Clock, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { driverAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const LOCATION_INTERVAL_MS = 5 * 60 * 1000; // send location every 5 minutes

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const [schedules, setSchedules]         = useState([]);
  const [mySchedule, setMySchedule]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [locStatus, setLocStatus]         = useState('idle'); // idle | sending | ok | error
  const [lastLocAt, setLastLocAt]         = useState(null);
  const [showAll, setShowAll]             = useState(false);
  const locationTimerRef                  = useRef(null);
  const watchIdRef                        = useRef(null);
  const latestPosRef                      = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [sRes, mRes] = await Promise.all([
        driverAPI.getSchedules(),
        driverAPI.getMySchedule(),
      ]);
      setSchedules(sRes.data || []);
      setMySchedule(mRes.data || null);
    } catch {
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Start watching GPS when a journey is in_progress
  useEffect(() => {
    if (mySchedule?.journeyStatus === 'in_progress') {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
    return () => stopLocationTracking();
  }, [mySchedule?.id, mySchedule?.journeyStatus]);

  const startLocationTracking = () => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => { latestPosRef.current = pos.coords; },
      (err) => console.warn('GPS watch error:', err.message),
      { enableHighAccuracy: true, maximumAge: 30000 }
    );
    sendLocation(); // send immediately
    locationTimerRef.current = setInterval(sendLocation, LOCATION_INTERVAL_MS);
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    clearInterval(locationTimerRef.current);
    locationTimerRef.current = null;
  };

  const sendLocation = useCallback(async () => {
    if (!mySchedule?.id) return;
    setLocStatus('sending');
    const sendCoords = (coords) => {
      driverAPI.updateLocation(mySchedule.id, {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        speed: coords.speed,
      }).then(() => {
        setLocStatus('ok');
        setLastLocAt(new Date());
      }).catch(() => setLocStatus('error'));
    };

    if (latestPosRef.current) {
      sendCoords(latestPosRef.current);
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendCoords(pos.coords),
        () => setLocStatus('error'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [mySchedule?.id]);

  const handleClaim = async (scheduleId) => {
    try {
      await driverAPI.claimSchedule(scheduleId);
      toast.success('Schedule claimed!');
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not claim';
      if (msg.includes('already claimed')) {
        if (window.confirm('This schedule is claimed by another driver. Take over?')) {
          await driverAPI.takeoverSchedule(scheduleId);
          toast.success('Takeover successful');
          loadData();
        }
      } else {
        toast.error(msg);
      }
    }
  };

  const handleStart = async () => {
    if (!window.confirm('Start the journey? Passengers will see your live location.')) return;
    try {
      await driverAPI.startJourney(mySchedule.id);
      toast.success('Journey started! Location sharing active.');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start journey');
    }
  };

  const handleEnd = async () => {
    if (!window.confirm('End the journey?')) return;
    try {
      await driverAPI.endJourney(mySchedule.id);
      toast.success('Journey completed!');
      setMySchedule(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end journey');
    }
  };

  const fmtTime = (t) => {
    if (!t) return '—';
    const d = new Date(t);
    return d.toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-500 text-white px-4 pt-8 pb-6">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-red-200 text-sm">Shubha Yatra Driver</p>
            <h1 className="text-xl font-bold">{user?.name}</h1>
          </div>
          <button onClick={logout} className="flex items-center gap-1 text-red-200 text-sm hover:text-white">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Active schedule card */}
        {mySchedule ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-center gap-2">
              <Bus size={18} className="text-red-600" />
              <span className="font-semibold text-red-700">My Schedule Today</span>
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                mySchedule.journeyStatus === 'in_progress'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {mySchedule.journeyStatus === 'in_progress' ? 'In Progress' : 'Not Started'}
              </span>
            </div>
            <div className="px-4 py-4 space-y-2">
              <p className="font-semibold text-gray-800">{mySchedule.route?.origin} → {mySchedule.route?.destination}</p>
              <p className="text-sm text-gray-500">{mySchedule.bus?.name} · {mySchedule.bus?.busNumber}</p>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock size={14} /> {mySchedule.departureTime} → {mySchedule.arrivalTime}
              </div>

              {mySchedule.journeyStatus === 'in_progress' && (
                <div className={`flex items-center gap-2 text-xs mt-2 px-3 py-2 rounded-lg ${
                  locStatus === 'ok'      ? 'bg-green-50 text-green-700' :
                  locStatus === 'error'   ? 'bg-red-50 text-red-700' :
                  locStatus === 'sending' ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  <Navigation size={13} />
                  {locStatus === 'ok'      && `Location sent ${lastLocAt ? fmtTime(lastLocAt) : ''}`}
                  {locStatus === 'error'   && 'Location error — retrying'}
                  {locStatus === 'sending' && 'Sending location…'}
                  {locStatus === 'idle'    && 'Location sharing starting…'}
                  <button onClick={sendLocation} className="ml-auto underline">Send now</button>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                {mySchedule.journeyStatus === 'not_started' && (
                  <button onClick={handleStart}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg py-3 font-semibold hover:bg-green-700">
                    <Play size={18} /> Start Journey
                  </button>
                )}
                {mySchedule.journeyStatus === 'in_progress' && (
                  <button onClick={handleEnd}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white rounded-lg py-3 font-semibold hover:bg-red-700">
                    <Square size={18} /> End Journey
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-200 p-6 text-center text-gray-400">
            <Bus size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No active schedule. Claim one below.</p>
          </div>
        )}

        {/* Available schedules */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Today's Schedules</h2>
            <button onClick={loadData} className="text-gray-400 hover:text-gray-600">
              <RefreshCw size={16} />
            </button>
          </div>
          {schedules.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No schedules for today</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {(showAll ? schedules : schedules.slice(0, 5)).map(s => {
                const isMine    = s.currentDriverId === user?.id;
                const isClaimed = !!s.currentDriverId && !isMine;
                return (
                  <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">
                        {s.route?.origin} → {s.route?.destination}
                      </p>
                      <p className="text-xs text-gray-400">{s.departureTime} · {s.bus?.busNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMine ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Mine</span>
                      ) : isClaimed ? (
                        <button onClick={() => handleClaim(s.id)}
                          className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium hover:bg-orange-200">
                          Takeover
                        </button>
                      ) : (
                        <button onClick={() => handleClaim(s.id)}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-medium hover:bg-blue-700">
                          Claim
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {schedules.length > 5 && (
                <button onClick={() => setShowAll(v => !v)}
                  className="w-full py-3 text-sm text-blue-600 flex items-center justify-center gap-1 hover:bg-gray-50">
                  {showAll ? 'Show less' : `Show all ${schedules.length} schedules`}
                  <ChevronRight size={14} className={showAll ? 'rotate-90' : ''} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
