import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16 w-full flex-1">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: January 2025</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">1. Information We Collect</h2>
            <p>When you use Shubha Yatra, we collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
              <li>Full name, email address, and phone number when you register</li>
              <li>Passenger details (name, age, gender) when making a booking</li>
              <li>Payment information processed securely through eSewa and Khalti</li>
              <li>Travel preferences and booking history</li>
              <li>Device information and usage data when you use our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
              <li>Process and confirm your bus ticket bookings</li>
              <li>Send booking confirmations, tickets, and travel updates via email or SMS</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Improve our platform, features, and user experience</li>
              <li>Comply with legal obligations under Nepal law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">3. Information Sharing</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
              <li><strong>Bus operators</strong> — only the details necessary to fulfill your booking (passenger name, seat number, boarding point)</li>
              <li><strong>Payment gateways</strong> — eSewa and Khalti process payments under their own privacy policies</li>
              <li><strong>Government authorities</strong> — when required by law or legal process</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">4. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. Passwords are encrypted and payment data is handled exclusively by certified payment processors.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">5. Cookies</h2>
            <p>We use cookies and similar tracking technologies to maintain your session, remember your preferences, and analyze platform usage. You can disable cookies in your browser settings, though some features may not function correctly.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <a href="mailto:support@shubhayatra.com" className="text-primary-600 hover:underline">support@shubhayatra.com</a>. We will respond within 7 business days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">7. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify registered users of significant changes via email. Continued use of Shubha Yatra after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">8. Contact</h2>
            <p>For privacy-related questions, contact us at:</p>
            <div className="mt-2 text-gray-600">
              <p>Shubha Yatra Pvt. Ltd.</p>
              <p>New Baneshwor, Kathmandu, Nepal</p>
              <p>Email: <a href="mailto:support@shubhayatra.com" className="text-primary-600 hover:underline">support@shubhayatra.com</a></p>
              <p>Phone: +977-1-4567890</p>
            </div>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  );
}
