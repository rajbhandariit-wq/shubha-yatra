// SMS Service — supports Sparrow SMS (Nepal), TextBelt (testing), or console fallback
// Set SMS_PROVIDER in .env: 'sparrow' | 'textbelt' | 'console'

const PROVIDER      = process.env.SMS_PROVIDER        || 'console';
const SPARROW_TOKEN = process.env.SPARROW_SMS_TOKEN    || '';
const SPARROW_FROM  = process.env.SPARROW_SMS_FROM     || 'ShubhaYatra';
const TEXTBELT_KEY  = process.env.TEXTBELT_KEY         || 'textbelt'; // 'textbelt' = 1 free/day

// Normalize to Nepal international format (+977XXXXXXXXXX)
const normalizePhone = (phone) => {
  if (!phone) return null;
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  if (clean.startsWith('+977')) return clean;
  if (clean.startsWith('977'))  return `+${clean}`;
  if (clean.startsWith('0'))    return `+977${clean.slice(1)}`;
  return `+977${clean}`;
};

// ─── Providers ────────────────────────────────────────────────────────────────

const sendViaSparrow = async (to, message) => {
  if (!SPARROW_TOKEN) throw new Error('SPARROW_SMS_TOKEN not set in .env');
  // SparrowSMS expects number without leading '+' e.g. 9779841234567
  const toClean = to.replace(/^\+/, '');
  const payload = SPARROW_FROM
    ? { token: SPARROW_TOKEN, from: SPARROW_FROM, to: toClean, text: message }
    : { token: SPARROW_TOKEN, to: toClean, text: message };
  console.log('📱 SparrowSMS request → to:', toClean, '| from:', SPARROW_FROM || '(default)');
  const res = await fetch('https://api.sparrowsms.com/v2/sms/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const raw = await res.text();
  console.log('📱 SparrowSMS raw response:', raw);
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error(`SparrowSMS non-JSON response: ${raw}`); }
  if (data.response_code !== 200) throw new Error(`SparrowSMS error ${data.response_code}: ${data.message || data.response}`);
  console.log(`📱 SparrowSMS sent ✅ credits remaining: ${data.credits_remaining}`);
  return { success: true, provider: 'sparrow', credits: data.credits_remaining };
};

const sendViaTextBelt = async (to, message) => {
  const res = await fetch('https://textbelt.com/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: to, message, key: TEXTBELT_KEY }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'TextBelt send failed');
  console.log(`📱 SMS sent via TextBelt — quota remaining: ${data.quotaRemaining}`);
  return { success: true, provider: 'textbelt', quotaRemaining: data.quotaRemaining };
};

const sendViaConsole = (to, message) => {
  console.log(`📱 [SMS - console] To: ${to}`);
  console.log(`   ${message}`);
  return { success: true, provider: 'console', mock: true };
};

// ─── Main send function ───────────────────────────────────────────────────────

const sendSMS = async ({ to, message }) => {
  const phone = normalizePhone(to);
  if (!phone) {
    console.warn('📱 SMS skipped — no phone number');
    return { success: false, error: 'No phone number' };
  }

  try {
    if (PROVIDER === 'sparrow')   return await sendViaSparrow(phone, message);
    if (PROVIDER === 'textbelt')  return await sendViaTextBelt(phone, message);
    return sendViaConsole(phone, message);
  } catch (err) {
    console.error(`❌ SMS failed (${PROVIDER}) to ${phone}:`, err.message);
    // Degrade to console so booking flow is never blocked by SMS failure
    return sendViaConsole(phone, `[FALLBACK] ${message}`);
  }
};

// ─── Message templates ────────────────────────────────────────────────────────

const sendTicketSMS = ({ phone, ticketNumber, route, date, departureTime, seats }) => {
  const seatStr = Array.isArray(seats) ? seats.join(',') : seats;
  const message = `Shubha Yatra: Confirmed! Ticket: ${ticketNumber}, ${route}, ${date} ${departureTime}, Seats: ${seatStr}. Subha Yatra! 🙏`;
  return sendSMS({ to: phone, message });
};

const sendPendingBankSMS = ({ phone, ticketNumber, amount, reference }) => {
  const message = `Shubha Yatra: Booking received. Ticket: ${ticketNumber}, NPR ${amount}. Transfer to NABIL Bank using Ref: ${reference}. Ticket sent after verification (24hrs).`;
  return sendSMS({ to: phone, message });
};

const sendAlertSMS = ({ phones, message }) =>
  Promise.all(phones.map(phone => sendSMS({ to: phone, message })));

module.exports = { sendSMS, sendTicketSMS, sendPendingBankSMS, sendAlertSMS, normalizePhone };
