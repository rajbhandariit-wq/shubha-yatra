import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Bus, MapPin, Calendar, Clock, ArrowRight, CheckCircle, Download, Share2, Printer, Home } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { customerAPI } from '../../services/api';

export default function Ticket() {
  const { bookingId } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!booking);

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 w-full">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Booking Confirmed!</h1>
          <p className="text-gray-500 mt-1">Your ticket has been sent to your email</p>
          <p className="text-green-600 font-nepali text-lg mt-1">शुभ यात्रा! 🙏</p>
        </div>

        {/* Ticket */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 print:shadow-none" id="ticket">
          {/* Header */}
          <div className="bg-gradient-to-r from-nepal-blue via-blue-700 to-nepal-red p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 font-nepali text-8xl font-bold flex items-center justify-center">शुभ</div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bus className="h-8 w-8" />
                <div><p className="font-bold text-xl">Shubha Yatra</p><p className="text-blue-200 text-sm font-nepali">शुभ यात्रा</p></div>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-200">Ticket No.</p>
                <p className="text-2xl font-mono font-bold tracking-wider">{booking?.ticketNumber}</p>
              </div>
            </div>
          </div>

          {/* Route section */}
          <div className="px-6 py-6 border-b border-dashed border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">From</p>
                <p className="text-2xl font-bold text-gray-800">{route?.source}</p>
                <p className="text-primary-500 font-semibold">{schedule?.departureTime}</p>
              </div>
              <div className="flex flex-col items-center text-gray-400 gap-1 px-4">
                <Bus className="h-6 w-6 text-nepal-blue" />
                <div className="flex items-center gap-1"><div className="h-px w-8 bg-gray-300"/><ArrowRight className="h-4 w-4"/><div className="h-px w-8 bg-gray-300"/></div>
                <p className="text-xs">{bus?.type}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide">To</p>
                <p className="text-2xl font-bold text-gray-800">{route?.destination}</p>
                <p className="text-nepal-blue font-semibold">{schedule?.arrivalTime}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-dashed border-gray-200">
            <div className="text-center"><p className="text-xs text-gray-400 mb-1">Date</p><div className="flex items-center justify-center gap-1"><Calendar className="h-3.5 w-3.5 text-gray-500"/><p className="font-semibold text-sm">{schedule?.travelDate}</p></div></div>
            <div className="text-center"><p className="text-xs text-gray-400 mb-1">Seat(s)</p><p className="font-bold text-sm">{booking?.seats?.sort((a,b)=>a-b).join(', ')}</p></div>
            <div className="text-center"><p className="text-xs text-gray-400 mb-1">Bus</p><p className="font-semibold text-sm text-xs truncate">{bus?.name}</p></div>
          </div>

          {/* Passengers */}
          {booking?.passengerDetails?.length > 0 && (
            <div className="px-6 py-4 border-b border-dashed border-gray-200">
              <p className="text-xs text-gray-400 uppercase mb-3">Passengers</p>
              <div className="space-y-1">
                {booking.passengerDetails.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-gray-400">Seat {booking.seats[i]} {p.age ? `• Age ${p.age}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-5 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Total Paid</p>
              <p className="text-2xl font-extrabold text-primary-600">NPR {booking?.totalAmount}</p>
              <p className="text-xs text-gray-400">{booking?.paymentMethod?.toUpperCase()} • {booking?.paymentReference}</p>
            </div>
            <div className={`text-center px-4 py-2 rounded-xl ${booking?.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <p className="text-xs font-medium uppercase">Status</p>
              <p className="font-bold capitalize">{booking?.bookingStatus}</p>
            </div>
          </div>

          {/* QR placeholder */}
          <div className="px-6 pb-6 text-center">
            <div className="inline-block border-2 border-gray-200 rounded-xl p-3 bg-white">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-xs text-gray-400 text-center">QR Code<br/>{booking?.ticketNumber}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Show this ticket at boarding • यो टिकट देखाउनुहोस्</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-6 justify-center">
          <button onClick={() => window.print()} className="btn-outline flex items-center gap-2"><Printer className="h-4 w-4" /> Print Ticket</button>
          <button onClick={() => navigator.clipboard?.writeText(booking?.ticketNumber).then(() => alert('Ticket number copied!'))} className="btn-outline flex items-center gap-2"><Share2 className="h-4 w-4" /> Share</button>
          <Link to="/my-bookings" className="btn-secondary flex items-center gap-2"><Bus className="h-4 w-4" /> My Bookings</Link>
          <Link to="/" className="btn-primary flex items-center gap-2"><Home className="h-4 w-4" /> Home</Link>
        </div>

        <div className="mt-8 text-center p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <p className="font-semibold mb-1">📧 Ticket sent to your email!</p>
          <p>A copy has also been sent via SMS to your registered phone number.</p>
          <p className="font-nepali text-amber-600 mt-1">यात्राको शुभकामना! 🙏</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
