import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Bus, MapPin, Calendar, Clock, ArrowRight, CheckCircle, Download, Share2, Printer, Home } from 'lucide-react';
import { CATEGORY_META } from '../../utils/seatLayout';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { customerAPI } from '../../services/api';
import ShareModal from '../../components/ShareModal';

export default function Ticket() {
  const { bookingId } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!booking);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (!booking) {
      customerAPI.getBooking(bookingId).then(r => setBooking(r.data.booking)).catch(console.error).finally(() => setLoading(false));
    }
  }, [bookingId]);

  if (loading) return (
    <div className="min-h-screen flex flex-col"><Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent" />
      </div>
    </div>
  );

  const schedule = booking?.schedule;
  const route = schedule?.route;
  const bus = schedule?.bus;
  const estimatedTimeHours = route?.distance
  ? route.distance / 40
  : null;

const hours = estimatedTimeHours ? Math.floor(estimatedTimeHours) : 0;
const minutes = estimatedTimeHours
  ? Math.round((estimatedTimeHours - hours) * 60)
  : 0;

console.log("ROUTE DATA:", route);
console.log("ROUTE:", route);
  // Share ticket function using Web Share API
const shareTicket = async () => {
    // Create the shareable content
    const shareData = {
        title: 'Shubha Yatra Ticket',
        text: `🎫 Bus Ticket Confirmation!\n\n` +
              `Ticket: ${booking?.ticketNumber}\n` +
              `From: ${route?.source} → ${route?.destination}\n` +
              `Date: ${schedule?.travelDate}\n` +
              `Departure: ${schedule?.departureTime}\n` +
              `Arrival: ${schedule?.arrivalTime}\n` +
              `Seats: ${booking?.seats?.sort((a,b)=>a-b).join(', ')}\n` +
              `Passenger: ${booking?.passengerDetails?.[0]?.name}\n` +
              `Amount: NPR ${booking?.totalAmount}\n\n` +
              `View ticket: https://shubha-yatra.com/ticket/${bookingId}\n` +
              `शुभ यात्रा! 🙏`,
        url: `https://shubha-yatra.com/ticket/${bookingId}`
    };

    try {
        // Check if Web Share API is supported
        if (navigator.share) {
            await navigator.share(shareData);
            console.log('Ticket shared successfully');
        } else {
            // Fallback for older browsers / WebView
            await navigator.clipboard.writeText(shareData.text);
            alert('🎫 Ticket details copied to clipboard!\nYou can now paste and share.');
        }
    } catch (error) {
        console.error('Error sharing:', error);
        if (error.name !== 'AbortError') {
            // Fallback to clipboard if share fails or is cancelled
            await navigator.clipboard.writeText(shareData.text);
            alert('📋 Ticket details copied to clipboard!');
        }
    }
};

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 w-full">
        {/* Success header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Booking Confirmed!</h1>
          <p className="text-gray-500 text-sm mt-1">Your ticket has been sent to your email</p>
          <p className="text-green-600 font-nepali text-md mt-1">शुभ यात्रा! 🙏</p>
        </div>

        {/* Ticket - Fixed for portrait mode */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 print:shadow-none" id="ticket">
          {/* Header */}
          <div className="bg-gradient-to-r from-nepal-blue via-blue-700 to-nepal-red p-5 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 font-nepali text-7xl font-bold flex items-center justify-center">शुभ</div>
            <div className="relative">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src="/images/Android_logo_new.png" alt="Shubha Yatra" className="h-10 w-auto object-contain drop-shadow" />
                  <div>
                    <p className="font-bold text-xl">Shubha Yatra</p>
                    <p className="text-blue-200 text-sm font-nepali">शुभ यात्रा</p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-xs text-blue-200">Ticket No.</p>
                  <p className="text-xl font-mono font-bold tracking-wider break-all max-w-[200px]">{booking?.ticketNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Route section - FIXED for portrait */}
          <div className="px-5 py-5 border-b border-dashed border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* From */}
              <div className="text-center md:text-left w-full md:w-auto">
                <p className="text-xs text-gray-400 uppercase tracking-wide">From</p>
                <p className="text-xl md:text-2xl font-bold text-gray-800 break-words">{route?.source}</p>
                <p className="text-primary-500 font-semibold text-sm">{schedule?.departureTime}</p>
              </div>
              
              {/* Arrow for mobile (vertical) / desktop (horizontal) */}
              <div className="flex flex-col md:flex-row items-center text-gray-400 gap-1">
                <Bus className="h-5 w-5 text-nepal-blue" />
                <ArrowRight className="h-4 w-4 hidden md:block" />
                <div className="block md:hidden h-px w-16 bg-gray-300 my-1"></div>
                              <div className="text-center text-xs text-gray-500 mt-1">
                <p className="font-semibold text-gray-600">
                  {route?.distance} km
                </p>

                <p>
                  {route?.distance
                    ? `${Math.floor((route.distance / 40))}h ${Math.round(((route.distance / 40) % 1) * 60)}m`
                    : ''}
                </p>
              </div>
                <div className="hidden md:flex items-center gap-1">
                  <div className="h-px w-8 bg-gray-300"/><ArrowRight className="h-4 w-4"/><div className="h-px w-8 bg-gray-300"/>
                </div>
                {bus?.seatLayout?.busCategory && CATEGORY_META[bus.seatLayout.busCategory] ? (
                  <span className={`text-xs mt-1 md:mt-0 px-2 py-0.5 rounded-full font-medium ${CATEGORY_META[bus.seatLayout.busCategory].color}`}>
                    {CATEGORY_META[bus.seatLayout.busCategory].icon} {CATEGORY_META[bus.seatLayout.busCategory].label}
                  </span>
                ) : (
                  <p className="text-xs mt-1 md:mt-0">{bus?.type || '—'}</p>
                )}
              </div>
                {/* 🔥 Distance + Time (NEW PART) */}

              
              {/* To */}
              <div className="text-center md:text-right w-full md:w-auto">
                <p className="text-xs text-gray-400 uppercase tracking-wide">To</p>
                <p className="text-xl md:text-2xl font-bold text-gray-800 break-words">{route?.destination}</p>
                <p className="text-nepal-blue font-semibold text-sm">{schedule?.arrivalTime}</p>
                {/* <p className="text-xs text-gray-500 mt-1"> {route?.distance} km</p>
               <p className="text-xs text-gray-500 mt-1">{route?.distance} km • {hours}h {minutes}m</p> */}
                
              </div>
            </div>
          </div>

          {/* Details - Responsive grid */}
          <div className="px-5 py-4 grid grid-cols-3 gap-2 border-b border-dashed border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Date</p>
              <div className="flex items-center justify-center gap-1">
                <Calendar className="h-3 w-3 text-gray-500" />
                <p className="font-semibold text-xs sm:text-sm">{schedule?.travelDate}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Seat(s)</p>
              <p className="font-bold text-sm break-words">{booking?.seats?.sort((a,b)=>a-b).join(', ')}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Bus</p>
              <p className="font-semibold text-xs sm:text-sm break-words">{bus?.name}</p>
              {bus?.registrationNumber && <p className="text-xs text-gray-400">{bus.registrationNumber}</p>}
            </div>
          </div>

          {/* Operator */}
          {(bus?.provider?.companyName || bus?.provider?.name) && (
            <div className="px-5 py-3 border-b border-dashed border-gray-200 flex items-center justify-between text-sm">
              <span className="text-xs text-gray-400 uppercase">Operator</span>
              <span className="font-semibold text-gray-700">{bus?.provider?.companyName || bus?.provider?.name}</span>
            </div>
          )}

          {/* Passengers */}
          {booking?.passengerDetails?.length > 0 && (
            <div className="px-5 py-4 border-b border-dashed border-gray-200">
              <p className="text-xs text-gray-400 uppercase mb-2">Passengers</p>
              <div className="space-y-1">
                {booking.passengerDetails.map((p, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm gap-1 sm:gap-0">
                    <span className="font-medium break-words">{p.name}</span>
                    <span className="text-gray-400 text-xs sm:text-sm">Seat {booking.seats[i]} {p.age ? `• Age ${p.age}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer - Responsive */}
          <div className="px-5 py-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <p className="text-xs text-gray-400">Total Paid</p>
              <p className="text-2xl font-extrabold text-primary-600">NPR {booking?.totalAmount}</p>
              <p className="text-xs text-gray-400 break-words">{booking?.paymentMethod?.toUpperCase()} • {booking?.paymentReference}</p>
            </div>
            <div className={`text-center px-4 py-2 rounded-xl ${booking?.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <p className="text-xs font-medium uppercase">Status</p>
              <p className="font-bold capitalize">{booking?.bookingStatus}</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="px-5 pb-5 text-center">
            <div className="inline-block border-2 border-gray-200 rounded-xl p-3 bg-white">
              <QRCodeSVG
                value={JSON.stringify({
                  ticket: booking?.ticketNumber,
                  route: `${route?.source} → ${route?.destination}`,
                  date: schedule?.travelDate,
                  departure: schedule?.departureTime,
                  seats: booking?.seats?.sort((a, b) => a - b).join(', '),
                  passenger: booking?.passengerDetails?.[0]?.name,
                })}
                size={96}
                bgColor="#ffffff"
                fgColor="#1e3a5f"
                level="M"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">Show this ticket at boarding • यो टिकट देखाउनुहोस्</p>
          </div>
        </div>

        {/* Actions - Responsive buttons */}
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          <button onClick={() => window.print()} className="btn-outline flex items-center gap-2 text-sm"><Printer className="h-4 w-4" /> Print</button>
          {/* <button onClick={() => navigator.clipboard?.writeText(booking?.ticketNumber).then(() => alert('Ticket number copied!'))} className="btn-outline flex items-center gap-2 text-sm"><Share2 className="h-4 w-4" /> Share</button> */}
          <button onClick={() => setShowShareModal(true)} className="btn-outline flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Share
            </button>
          <Link to="/my-bookings" className="btn-secondary flex items-center gap-2 text-sm"><Bus className="h-4 w-4" /> My Bookings</Link>
          <Link to="/" className="btn-primary flex items-center gap-2 text-sm"><Home className="h-4 w-4" /> Home</Link>
        </div>

        <div className="mt-6 text-center p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <p className="font-semibold mb-1">📧 Ticket sent to your email!</p>
          <p>A copy has also been sent via SMS to your registered phone number.</p>
          <p className="font-nepali text-amber-600 mt-1">यात्राको शुभकामना! 🙏</p>
        </div>
      </div>
      <Footer />
      {showShareModal && <ShareModal booking={booking} onClose={() => setShowShareModal(false)} />}
    </div>
  );
}