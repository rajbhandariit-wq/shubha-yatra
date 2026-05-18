import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16 w-full flex-1">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: January 2025</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Shubha Yatra ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our services. These terms apply to all visitors, registered users, and customers.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">2. Booking and Ticketing</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Bookings are confirmed only upon successful payment. A confirmation email and e-ticket will be sent to your registered email address.</li>
              <li>You are responsible for providing accurate passenger details. Shubha Yatra is not liable for boarding denial due to incorrect passenger information.</li>
              <li>Tickets are non-transferable. The name on the ticket must match a valid government-issued ID.</li>
              <li>Shubha Yatra acts as an intermediary between passengers and bus operators. The actual transport service is provided by the operator.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">3. Pricing and Payments</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>All fares are displayed in Nepalese Rupees (NPR) and are inclusive of applicable taxes.</li>
              <li>Prices may change without prior notice. The fare confirmed at the time of booking is the final amount charged.</li>
              <li>Payments are processed securely via eSewa and Khalti. Shubha Yatra does not store payment card details.</li>
              <li>In case of payment failure, no amount will be deducted. If deducted, it will be reversed within 5–7 business days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">4. Cancellations</h2>
            <p>Cancellation terms are governed by our <strong>Refund Policy</strong>. Cancellations must be made through your account dashboard. Shubha Yatra reserves the right to cancel bookings in exceptional circumstances (natural disasters, route disruptions), in which case a full refund will be issued.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">5. Travel Responsibility</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Passengers must arrive at the boarding point at least 15 minutes before departure.</li>
              <li>Shubha Yatra is not responsible for delays, accidents, or losses caused by the bus operator or road conditions.</li>
              <li>Passengers are responsible for ensuring they meet all travel requirements, including valid ID.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">6. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. Any activity under your account is your responsibility. Notify us immediately at <a href="mailto:support@shubha-yatra.com" className="text-primary-600 hover:underline">support@shubha-yatra.com</a> if you suspect unauthorized access.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">7. Limitation of Liability</h2>
            <p>Shubha Yatra's liability is limited to the ticket fare paid. We are not liable for indirect, incidental, or consequential damages arising from use of the platform or travel disruptions.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">8. Governing Law</h2>
            <p>These Terms are governed by the laws of Nepal. Any disputes shall be resolved in the courts of Kathmandu, Nepal.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">9. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:support@shubha-yatra.com" className="text-primary-600 hover:underline">support@shubha-yatra.com</a> or call +977-1-4567890.</p>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  );
}
