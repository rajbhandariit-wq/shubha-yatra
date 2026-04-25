import { useState, useEffect } from 'react';
import { MessageSquare, Send, Mail, Smartphone, Users, Calendar } from 'lucide-react';
import ProviderLayout from '../../components/ProviderLayout';
import { providerAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ProviderMessaging() {
  const [schedules, setSchedules] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ type: 'Email', subject: '', message: '', scheduleId: '' });

  useEffect(() => {
    Promise.all([providerAPI.getSchedules(), providerAPI.getNotifications()])
      .then(([s, n]) => { setSchedules(s.data.schedules||[]); setNotifications(n.data.notifications||[]); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return toast.error('Message cannot be empty');
    setSending(true);
    try {
      const res = await providerAPI.sendMessage(form);
      toast.success(res.data.message || 'Message sent!');
      setForm(f => ({ ...f, subject: '', message: '', scheduleId: '' }));
      const n = await providerAPI.getNotifications();
      setNotifications(n.data.notifications||[]);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
    finally { setSending(false); }
  };

  const TEMPLATES = [
    { label: '🚌 Delay Notice', text: 'Dear passenger, your bus has been delayed by 30 minutes due to traffic. We apologize for the inconvenience. The bus will depart at the updated time. Thank you for your patience.' },
    { label: '❌ Cancellation', text: 'Dear passenger, we regret to inform you that your scheduled bus has been cancelled due to unavoidable circumstances. A full refund will be processed within 3-5 business days. We apologize for the inconvenience.' },
    { label: '🎉 Trip Reminder', text: 'Dear passenger, your bus trip is scheduled for tomorrow. Please arrive at the boarding point 15 minutes before departure. Carry a valid ID and your booking ticket. शुभ यात्रा!' },
    { label: '⚠️ Route Change', text: 'Dear passenger, please note that your bus route has been slightly modified due to road conditions. Your pickup point remains the same. We appreciate your understanding.' },
  ];

  return (
    <ProviderLayout title="Messaging">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose message */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-nepal-blue"/> Compose Message</h3>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="label">Send via</label>
                <div className="flex gap-3">
                  {[['Email', Mail], ['SMS', Smartphone], ['Both', Users]].map(([v, Icon]) => (
                    <label key={v} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${form.type===v?'border-primary-500 bg-primary-50 text-primary-700':'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="type" value={v} checked={form.type===v} onChange={() => setForm(f=>({...f,type:v}))} className="hidden"/><Icon className="h-4 w-4"/>{v}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Target Schedule (optional)</label>
                <select value={form.scheduleId} onChange={e=>setForm(f=>({...f,scheduleId:e.target.value}))} className="input-field text-sm">
                  <option value="">All customers</option>
                  {schedules.map(s => <option key={s.id} value={s.id}>{s.route?.source} → {s.route?.destination} | {s.travelDate} {s.departureTime}</option>)}
                </select>
              </div>

              {(form.type === 'Email' || form.type === 'Both') && (
                <div><label className="label">Subject</label><input value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} className="input-field" placeholder="Important Notice from Shubha Yatra"/></div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Message *</label>
                  <span className="text-xs text-gray-400">{form.message.length} chars</span>
                </div>
                <textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} className="input-field min-h-[120px] resize-none" placeholder="Type your message here..." required/>
              </div>

              {/* Templates */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Quick templates:</p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map(t => <button key={t.label} type="button" onClick={() => setForm(f=>({...f,message:t.text}))} className="text-xs bg-gray-50 border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-600 hover:text-primary-600 px-2.5 py-1.5 rounded-lg transition-all">{t.label}</button>)}
                </div>
              </div>

              <button type="submit" disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
                {sending ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"/> : <Send className="h-4 w-4"/>}
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        {/* Message history */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2"><Calendar className="h-5 w-5 text-green-600"/> Message History</h3>
            {loading ? <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"/></div> :
              notifications.length === 0 ? <div className="text-center py-10 text-gray-400"><MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-200"/><p>No messages sent yet</p></div> : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {notifications.map(n => (
                  <div key={n.id} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {n.type === 'Email' ? <Mail className="h-3.5 w-3.5 text-blue-500"/> : n.type === 'SMS' ? <Smartphone className="h-3.5 w-3.5 text-green-500"/> : <Users className="h-3.5 w-3.5 text-purple-500"/>}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${n.status==='sent'?'bg-green-100 text-green-700':'bg-red-100 text-red-600'}`}>{n.type} • {n.status}</span>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(n.sentAt||n.createdAt).toLocaleDateString()}</span>
                    </div>
                    {n.subject && <p className="text-sm font-medium text-gray-700 mb-0.5">{n.subject}</p>}
                    <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.recipients?.length || 0} recipient(s)</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
