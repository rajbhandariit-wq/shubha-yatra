const nodemailer = require('nodemailer');

// Mock transporter - logs to console; swap with real SMTP for production
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  auth: {
    user: process.env.EMAIL_USER || 'mock@ethereal.email',
    pass: process.env.EMAIL_PASS || 'mockpassword'
  }
});

const sendTicketEmail = async ({ to, name, ticketNumber, route, date, seats, amount }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 2px solid #DC143C; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #DC143C, #003893); padding: 20px; text-align: center; color: white;">
        <h1 style="margin:0; font-size:28px;">🚌 शुभ यात्रा</h1>
        <p style="margin:5px 0; font-size:14px;">Shubha Yatra - Your Safe Journey Partner</p>
      </div>
      <div style="padding: 24px;">
        <h2 style="color:#DC143C;">Booking Confirmed! ✅</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your ticket has been confirmed. Safe travels!</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background:#f5f5f5;"><td style="padding:8px; font-weight:bold;">Ticket No.</td><td style="padding:8px;">${ticketNumber}</td></tr>
          <tr><td style="padding:8px; font-weight:bold;">Route</td><td style="padding:8px;">${route}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding:8px; font-weight:bold;">Date</td><td style="padding:8px;">${date}</td></tr>
          <tr><td style="padding:8px; font-weight:bold;">Seats</td><td style="padding:8px;">${seats.join(', ')}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding:8px; font-weight:bold;">Amount Paid</td><td style="padding:8px;">NPR ${amount}</td></tr>
        </table>
        <p style="color:#666; font-size:12px;">Please arrive 15 minutes before departure. शुभ यात्रा! 🙏</p>
      </div>
      <div style="background:#003893; color:white; text-align:center; padding:12px; font-size:12px;">
        © 2024 Shubha Yatra | Nepal's Trusted Bus Booking Platform
      </div>
    </div>`;

  try {
    const info = await transporter.sendMail({
      from: `"Shubha Yatra" <${process.env.EMAIL_FROM || 'noreply@shubhayatra.com'}>`,
      to, subject: `🎫 Booking Confirmed - ${ticketNumber} | Shubha Yatra`, html
    });
    console.log('📧 [MOCK EMAIL] Ticket sent to:', to, '| MessageId:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.log('📧 [MOCK EMAIL] Would send to:', to, '| Ticket:', ticketNumber);
    return { success: true, mock: true };
  }
};

const sendGenericEmail = async ({ to, subject, message }) => {
  try {
    await transporter.sendMail({
      from: `"Shubha Yatra" <${process.env.EMAIL_FROM || 'noreply@shubhayatra.com'}>`,
      to, subject, text: message,
      html: `<div style="font-family:Arial,sans-serif;padding:20px;border-left:4px solid #DC143C;"><h3 style="color:#DC143C;">Shubha Yatra 🚌</h3><p>${message}</p></div>`
    });
    console.log('📧 [MOCK EMAIL] Generic email sent to:', to);
    return { success: true };
  } catch {
    console.log('📧 [MOCK EMAIL] Would send to:', to, '| Subject:', subject);
    return { success: true, mock: true };
  }
};

module.exports = { sendTicketEmail, sendGenericEmail };
