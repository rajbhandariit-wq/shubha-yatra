// Mock SMS Service - logs to console
// In production, integrate with: Sparrow SMS, Aakash SMS, Twilio, etc.

const sendSMS = async ({ to, message }) => {
  console.log(`📱 [MOCK SMS] To: ${to}`);
  console.log(`   Message: ${message}`);
  console.log(`   [SMS would be sent via Sparrow SMS / Twilio in production]`);
  return { success: true, mock: true, to, message };
};

const sendTicketSMS = async ({ phone, ticketNumber, route, date, seats }) => {
  const message = `Shubha Yatra: Booking confirmed! Ticket: ${ticketNumber}, Route: ${route}, Date: ${date}, Seats: ${seats.join(',')}. Subha Yatra!`;
  return sendSMS({ to: phone, message });
};

const sendAlertSMS = async ({ phones, message }) => {
  const results = await Promise.all(phones.map(phone => sendSMS({ to: phone, message })));
  return results;
};

module.exports = { sendSMS, sendTicketSMS, sendAlertSMS };
