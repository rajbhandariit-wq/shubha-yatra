import { X, Link as LinkIcon, Mail, MessageCircle, Check } from 'lucide-react';
import { useState } from 'react';

function ViberIcon({ size = 20, color = '#7360F2' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M11.985 2C6.392 2 2 6.392 2 11.985c0 2.458.9 4.71 2.382 6.445L3 21l2.694-1.322A9.94 9.94 0 0 0 11.985 22C17.578 22 22 17.608 22 12.015 22 6.422 17.578 2 11.985 2zm5.21 13.674c-.22.617-.648 1.13-1.21 1.46-.386.223-.814.345-1.25.345-.31 0-.617-.056-.91-.167-1.03-.387-2.01-.96-2.87-1.712a13.2 13.2 0 0 1-2.11-2.476 8.36 8.36 0 0 1-1.1-2.29c-.19-.64-.167-1.318.067-1.94.22-.578.63-1.068 1.164-1.38.19-.11.4-.167.618-.167.14 0 .28.028.41.083.19.083.345.228.44.413l1.187 2.18c.1.184.125.4.07.6-.056.2-.183.373-.357.486l-.44.29a.47.47 0 0 0-.206.318.47.47 0 0 0 .072.375c.332.56.748 1.066 1.233 1.497.49.436 1.043.794 1.642 1.062a.47.47 0 0 0 .378.015.47.47 0 0 0 .272-.272l.25-.485c.1-.194.268-.342.47-.404a.76.76 0 0 1 .6.056l2.1 1.246c.18.108.316.274.383.47.067.195.057.407-.027.594z"/>
    </svg>
  );
}

export default function ShareModal({ booking, onClose }) {
  const [copied, setCopied] = useState(false);
  const ticketUrl = `https://shubha-yatra.com/ticket/${booking?.id || booking?.bookingId}`;
  const text = `🎫 Bus ticket booked!\n${booking?.schedule?.route?.source || 'N/A'} → ${booking?.schedule?.route?.destination || 'N/A'}\nTicket: ${booking?.ticketNumber}\nSeats: ${booking?.seats?.join(', ') || 'N/A'}\nAmount: NPR ${booking?.totalAmount}\n\nशुभ यात्रा! 🙏`;
  const encoded = encodeURIComponent(text + '\n' + ticketUrl);

  const shareOptions = [
    { name: 'WhatsApp', Icon: () => <MessageCircle size={20} color="#25D366" />, color: '#25D366', url: `https://wa.me/?text=${encoded}` },
    { name: 'Viber',    Icon: () => <ViberIcon size={20} />,                     color: '#7360F2', url: `viber://forward?text=${encoded}`, deepLink: true },
    { name: 'Email',    Icon: () => <Mail size={20} color="#EA4335" />,           color: '#EA4335', url: `mailto:?subject=Bus Ticket ${booking?.ticketNumber}&body=${encodeURIComponent(text + '\n\nView ticket: ' + ticketUrl)}` },
    { name: 'Copy Link',Icon: () => copied ? <Check size={20} color="#16a34a" /> : <LinkIcon size={20} color="#6B7280" />, color: copied ? '#16a34a' : '#6B7280', action: 'copy' },
  ];

  const handleShare = async (option) => {
    if (option.action === 'copy') {
      await navigator.clipboard.writeText(ticketUrl);
      setCopied(true);
      setTimeout(() => { setCopied(false); onClose(); }, 1200);
    } else if (option.deepLink) {
      // Deep links (viber://, whatsapp://) — must use direct navigation, not window.open
      const a = document.createElement('a');
      a.href = option.url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onClose();
    } else {
      window.open(option.url, '_blank');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-xs w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold">Share Ticket</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {shareOptions.map(({ name, Icon, color }) => (
            <button
              key={name}
              onClick={() => handleShare(shareOptions.find(o => o.name === name))}
              className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
                <Icon />
              </div>
              <span className="text-xs text-gray-600 text-center leading-tight">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
