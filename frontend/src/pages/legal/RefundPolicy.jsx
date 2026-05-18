import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const TIERS = [
  { when: 'More than 24 hours before departure', refund: '90%', color: 'bg-green-100 text-green-700' },
  { when: '12–24 hours before departure',        refund: '75%', color: 'bg-yellow-100 text-yellow-700' },
  { when: '6–12 hours before departure',         refund: '50%', color: 'bg-orange-100 text-orange-700' },
  { when: 'Less than 6 hours before departure',  refund: '0%',  color: 'bg-red-100 text-red-700' },
];

export default function RefundPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16 w-full flex-1">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Refund Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: January 2025</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Cancellation Refund Schedule</h2>
            <p className="mb-4">Refund amounts depend on how far in advance you cancel before the scheduled departure time:</p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Cancellation Time</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Refund Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {TIERS.map(t => (
                    <tr key={t.when}>
                      <td className="px-4 py-3 text-gray-700">{t.when}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full font-semibold text-xs ${t.color}`}>{t.refund}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-400">* Refund percentages are of the ticket fare paid. Payment gateway charges (if any) are non-refundable.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">How to Cancel</h2>
            <ol className="list-decimal pl-5 space-y-1 text-gray-600">
              <li>Log in to your Shubha Yatra account</li>
              <li>Go to <strong>My Bookings</strong></li>
              <li>Select the booking you wish to cancel</li>
              <li>Click <strong>Cancel Booking</strong> and confirm</li>
            </ol>
            <p className="mt-3">Cancellations are not accepted via phone or email — they must be initiated through your account dashboard.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Refund Processing Time</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li><strong>eSewa:</strong> Refunded to your eSewa wallet within 3–5 business days</li>
              <li><strong>Khalti:</strong> Refunded to your Khalti wallet within 3–5 business days</li>
            </ul>
            <p className="mt-3">Once a refund is initiated by Shubha Yatra, the timeline depends on the payment gateway. We will send a confirmation email when the refund is processed.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Operator Cancellations</h2>
            <p>If a bus operator cancels a scheduled trip, or if the bus does not depart within 2 hours of the scheduled time, you are entitled to a <strong>full 100% refund</strong> regardless of how much time remains before departure.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Non-Refundable Situations</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>No-shows (passenger fails to board without cancelling)</li>
              <li>Cancellations made less than 6 hours before departure</li>
              <li>Incorrect passenger information provided at the time of booking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Disputes</h2>
            <p>If you believe a refund was incorrectly processed, contact us within 7 days of the cancellation at <a href="mailto:support@shubha-yatra.com" className="text-primary-600 hover:underline">support@shubha-yatra.com</a> with your booking reference number. We will review and respond within 3 business days.</p>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  );
}
