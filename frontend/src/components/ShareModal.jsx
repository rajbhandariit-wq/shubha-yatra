import { X, Facebook, Twitter, Link as LinkIcon, Mail, MessageCircle } from 'lucide-react';

export default function ShareModal({ booking, onClose }) {
    const ticketUrl = `https://shubha-yatra.com/ticket/${booking?.id || booking?.bookingId}`;
    const text = `🎫 Bus ticket booked!\n${booking?.schedule?.route?.source || 'N/A'} → ${booking?.schedule?.route?.destination || 'N/A'}\nTicket: ${booking?.ticketNumber}\nSeats: ${booking?.seats?.join(', ') || 'N/A'}\nAmount: NPR ${booking?.totalAmount}\n\nशुभ यात्रा! 🙏`;

    const shareOptions = [
        { name: 'WhatsApp', icon: MessageCircle, color: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(text + '\n' + ticketUrl)}` },
        { name: 'Facebook', icon: Facebook, color: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(ticketUrl)}` },
        { name: 'Twitter', icon: Twitter, color: '#1DA1F2', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(ticketUrl)}` },
        { name: 'Copy Link', icon: LinkIcon, color: '#6B7280', action: 'copy' },
        { name: 'Email', icon: Mail, color: '#EA4335', url: `mailto:?subject=Bus Ticket ${booking?.ticketNumber}&body=${encodeURIComponent(text + '\n\nView ticket: ' + ticketUrl)}` }
    ];

    const handleCopy = async () => {
        await navigator.clipboard.writeText(ticketUrl);
        alert('Link copied to clipboard!');
        onClose();
    };

    const handleShare = async (option) => {
        if (option.action === 'copy') {
            await handleCopy();
        } else if (option.url) {
            window.open(option.url, '_blank');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Share Ticket</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="grid grid-cols-5 gap-3">
                    {shareOptions.map(option => (
                        <button
                            key={option.name}
                            onClick={() => handleShare(option)}
                            className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: option.color + '20' }}>
                                <option.icon className="h-5 w-5" style={{ color: option.color }} />
                            </div>
                            <span className="text-xs text-gray-600">{option.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
