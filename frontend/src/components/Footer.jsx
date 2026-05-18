import { Link } from 'react-router-dom';
import { Bus, Phone, Mail, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-nepal-blue to-gray-900 text-white mt-auto">
      {/* Nepal-themed divider */}
      <div className="h-1 bg-gradient-to-r from-nepal-red via-white to-nepal-red" />

      {/* Prayer flags decoration */}
      <div className="flex justify-center gap-1 py-3 overflow-hidden opacity-70">
        {['bg-blue-500','bg-white','bg-red-500','bg-green-500','bg-yellow-400'].map((c,i) => (
          <div key={i} className={`${c} h-8 w-6 prayer-flag`} style={{animationDelay:`${i*0.3}s`}} />
        ))}
        <div className="text-xs text-gray-400 self-end px-2">Prayer Flags • दर्सन</div>
        {['bg-yellow-400','bg-green-500','bg-red-500','bg-white','bg-blue-500'].map((c,i) => (
          <div key={i+5} className={`${c} h-8 w-6 prayer-flag`} style={{animationDelay:`${(i+5)*0.3}s`}} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-nepal-red p-2 rounded-lg"><Bus className="h-6 w-6 text-white" /></div>
              <div>
                <div className="text-white font-bold text-lg">Shubha Yatra</div>
                <div className="text-blue-300 text-sm font-nepali">शुभ यात्रा</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">Nepal's most trusted online bus ticket booking platform. Safe, reliable, and comfortable journeys across Nepal.</p>
            <p className="text-blue-300 font-nepali text-sm mt-2">नेपालको विश्वसनीय बस टिकट बुकिङ सेवा।</p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="bg-white/10 hover:bg-blue-600 p-2 rounded-lg transition-colors"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="bg-white/10 hover:bg-pink-600 p-2 rounded-lg transition-colors"><Instagram className="h-4 w-4" /></a>
              <a href="#" className="bg-white/10 hover:bg-red-600 p-2 rounded-lg transition-colors"><Youtube className="h-4 w-4" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              {[
                ['/', 'Home'], [`/search?source=Kathmandu&destination=Pokhara&date=${new Date().toISOString().split('T')[0]}`, 'Search Buses'], ['/login', 'Login'], ['/register', 'Register']].map(([to, label]) => (
                <li key={to}><Link to={to} className="hover:text-white transition-colors flex items-center gap-1.5">→ {label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Popular Routes */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Popular Routes</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              {[['Kathmandu', 'Pokhara'],['Kathmandu', 'Chitwan'],['Pokhara', 'Lumbini'],['Kathmandu', 'Birgunj'],['Pokhara', 'Biratnagar']].map(([src,dst]) => (
                <li key={`${src}-${dst}`}><Link
  to={`/search?source=${src}&destination=${dst}&date=${new Date().toISOString().split('T')[0]}`} className="hover:text-white transition-colors">→ {src} → {dst}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-nepal-red shrink-0" /><span>New Baneshwor, Kathmandu, Nepal</span></li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-nepal-red shrink-0" /><a href="tel:+977-1-4567890" className="hover:text-white">+977-1-4567890</a></li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-nepal-red shrink-0" /><a href="mailto:support@shubhayatra.com" className="hover:text-white">support@shubhayatra.com</a></li>
            </ul>
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-gray-400">Emergency Helpline</p>
              <p className="text-white font-semibold text-lg">1800-YATRA</p>
              <p className="text-xs text-gray-400">Available 24/7 | निःशुल्क सेवा</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© 2024 Shubha Yatra. All rights reserved. | नेपाल सरकार दर्ता संस्था</p>
          <div className="flex gap-4 text-gray-500 text-xs">
            <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-white">Terms of Service</Link>
            <Link to="/refund-policy" className="hover:text-white">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
