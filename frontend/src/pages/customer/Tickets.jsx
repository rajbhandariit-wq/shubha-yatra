import { useLocation, Link } from 'react-router-dom';
import { Bus, MapPin, Calendar, Clock, ArrowRight, CheckCircle, Printer, Share2, Home } from 'lucide-react';
import { CATEGORY_META } from '../../utils/seatLayout';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

function TicketCard({ booking, label, accentClass }) {
  const schedule = booking?.schedule;
  const route    = schedule?.route;
  const bus      = schedule?.bus;

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 print:shadow-none">
      {/* Colored header */}
      <div className={`p-5 text-white relative overflow-hidden ${accentClass}`}>
        <div className="absolute inset-0 opacity-10 font-nepali text-7xl font-bold flex items-center justify-center pointer-events-none">शुभ</div>
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/images/Android_logo_new.png" alt="Shubha Yatra" className="h-9 w-auto object-contain drop-shadow" />
            <div>
              <p className="font-bold text-lg">Shubha Yatra</p>
              <p className="text-white/70 text-xs font-nepali">{label}</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs text-white/70">Ticket No.</p>
            <p className="text-base font-mono font-bold tracking-wider">{booking?.ticketNumber}</p>
          </div>
        </div>
      </div>

      {/* Route */}
      <div className="px-5 py-4 border-b border-dashed border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-400 uppercase">From</p>
            <p className="text-xl font-bold text-gray-800">{route?.source}</p>
            <p className="text-primary-500 font-semibold text-sm">{schedule?.departureTime}</p>
          </div>
          <div className="flex flex-col items-center text-gray-400 gap-1">
            <Bus className="h-5 w-5 text-nepal-blue" />
            <ArrowRight className="h-4 w-4 hidden sm:block" />
            {bus?.seatLayout?.busCategory && CATEGORY_META[bus.seatLayout.busCategory] ? (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_META[bus.seatLayout.busCategory].color}`}>
                {CATEGORY_META[bus.seatLayout.busCategory].icon} {CATEGORY_META[bus.seatLayout.busCategory].label}
              </span>
            ) : (
              <p className="text-xs">{bus?.type}</p>
            )}
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs text-gray-400 uppercase">To</p>
            <p className="text-xl font-bold text-gray-800">{route?.destination}</p>
            <p className="text-nepal-blue font-semibold text-sm">{schedule?.arrivalTime}</p>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="px-5 py-3 grid grid-cols-3 gap-2 border-b border-dashed border-gray-200 text-center">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Date</p>
          <p className="font-semibold text-sm flex items-center justify-center gap-1"><Calendar className="h-3 w-3 text-gray-400" />{schedule?.travelDate}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Seat(s)</p>
          <p className="font-bold text-sm">{booking?.seats?.sort((a, b) => a - b).join(', ')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Bus</p>
          <p className="font-semibold text-xs sm:text-sm">{bus?.name}</p>
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
        <div className="px-5 py-3 border-b border-dashed border-gray-200">
          <p className="text-xs text-gray-400 uppercase mb-2">Passengers</p>
          <div className="space-y-1">
            {booking.passengerDetails.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="font-medium">{p.name}</span>
                <span className="text-gray-400">Seat {booking.seats[i]}{p.age ? ` · Age ${p.age}` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400">Amount</p>
          <p className="text-2xl font-extrabold text-primary-600">NPR {booking?.totalAmount}</p>
          <p className="text-xs text-gray-400">{booking?.paymentMethod?.toUpperCase()}</p>
        </div>
        <div className={`text-center px-4 py-2 rounded-xl ${booking?.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <p className="text-xs font-medium uppercase">Status</p>
          <p className="font-bold capitalize">{booking?.bookingStatus}</p>
        </div>
      </div>

      {/* QR Code */}
      <div className="px-5 pb-4 text-center">
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
            size={80}
            bgColor="#ffffff"
            fgColor="#1e3a5f"
            level="M"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">Show at boarding • यो टिकट देखाउनुहोस्</p>
      </div>
    </div>
  );
}

export default function Tickets() {
  const location = useLocation();
  const { bookings = [], isRoundTrip, bankDetails } = location.state || {};

  const [outboundBooking, returnBooking] = bookings;

  const shareAll = async () => {
    const lines = bookings.map(b =>
      `${b.ticketNumber}: ${b.schedule?.route?.source} → ${b.schedule?.route?.destination} on ${b.schedule?.travelDate}`
    ).join('\n');
    if (navigator.share) {
      await navigator.share({ title: 'Shubha Yatra Tickets', text: `🎫 My tickets:\n${lines}\nशुभ यात्रा! 🙏` });
    } else {
      await navigator.clipboard.writeText(lines);
      alert('Ticket details copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 w-full">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isRoundTrip ? 'Round-Trip Booking Confirmed!' : 'Booking Confirmed!'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Your ticket{bookings.length > 1 ? 's have' : ' has'} been sent to your email</p>
          <p className="text-green-600 font-nepali text-md mt-1">शुभ यात्रा! 🙏</p>
        </div>

        {/* Tickets */}
        <div className="space-y-6" id="tickets">
          {isRoundTrip && outboundBooking ? (
            <>
              <TicketCard booking={outboundBooking} label="→ Outbound Journey" accentClass="bg-gradient-to-r from-nepal-blue via-blue-700 to-blue-600" />
              {returnBooking && (
                <TicketCard booking={returnBooking} label="↩ Return Journey" accentClass="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600" />
              )}
            </>
          ) : (
            bookings.map((b, i) => (
              <TicketCard key={b.id} booking={b} label="शुभ यात्रा" accentClass="bg-gradient-to-r from-nepal-blue via-blue-700 to-nepal-red" />
            ))
          )}
        </div>

        {/* Grand total (round trip) */}
        {isRoundTrip && bookings.length === 2 && (
          <div className="mt-4 bg-white rounded-2xl border border-gray-200 px-5 py-4 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total Paid (Both Legs)</span>
            <span className="text-2xl font-extrabold text-primary-600">
              NPR {(parseFloat(outboundBooking?.totalAmount || 0) + parseFloat(returnBooking?.totalAmount || 0)).toFixed(0)}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          <button onClick={() => window.print()} className="btn-outline flex items-center gap-2 text-sm"><Printer className="h-4 w-4" /> Print</button>
          <button onClick={shareAll} className="btn-outline flex items-center gap-2 text-sm"><Share2 className="h-4 w-4" /> Share</button>
          <Link to="/my-bookings" className="btn-secondary flex items-center gap-2 text-sm"><Bus className="h-4 w-4" /> My Bookings</Link>
          <Link to="/" className="btn-primary flex items-center gap-2 text-sm"><Home className="h-4 w-4" /> Home</Link>
        </div>

        {/* Bank transfer details */}
        {bankDetails && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
            <p className="font-bold text-blue-800 mb-3">Bank Transfer Details</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-blue-600">Bank</span><span className="font-semibold">{bankDetails.bankName}</span></div>
              <div className="flex justify-between"><span className="text-blue-600">Account Name</span><span className="font-semibold">{bankDetails.accountName}</span></div>
              <div className="flex justify-between"><span className="text-blue-600">Account No.</span><span className="font-mono font-bold">{bankDetails.accountNumber}</span></div>
              <div className="flex justify-between"><span className="text-blue-600">SWIFT</span><span className="font-mono font-semibold">{bankDetails.swiftCode}</span></div>
              <div className="flex justify-between"><span className="text-blue-600">Branch</span><span className="font-semibold">{bankDetails.branch}</span></div>
              <div className="flex justify-between border-t border-blue-200 pt-1.5 mt-1">
                <span className="text-blue-600 font-semibold">Reference</span>
                <span className="font-mono font-bold text-blue-800">{bankDetails.reference}</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">Please use the reference number when making the transfer. Your booking will be confirmed within 24 hours.</p>
          </div>
        )}

        <div className="mt-6 text-center p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <p className="font-semibold mb-1">📧 Ticket{bookings.length > 1 ? 's' : ''} sent to your email!</p>
          <p className="font-nepali text-amber-600 mt-1">यात्राको शुभकामना! 🙏</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
