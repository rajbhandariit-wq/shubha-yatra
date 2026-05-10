const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

// Mock transporter - logs to console; swap with real SMTP for production
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER ,
    pass: process.env.SMTP_PASS ,
  }
});

    const sendTicketEmail = async ({
      to,
      name,
      ticketNumber,
      route,
      date,
      departureTime,
      seats = [],
      amount,
      passengers = []
    }) => {
      const passengerList = passengers.length
      ? passengers.map((p, i) => `${i + 1}. ${p.name || p}`).join('<br/>')
      : 'N/A';
          const qrData = JSON.stringify({
            ticketNumber,
            route,
            date,
            departureTime,
            passengers,});  
      const qrCode = await QRCode.toDataURL(qrData);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 2px solid #DC143C; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #DC143C, #003893); padding: 20px; text-align: center; color: white;">
        <h1 style="margin:0; font-size:28px;">🚌 शुभ यात्रा</h1>
        <p style="margin:5px 0; font-size:14px;">Shubha Yatra - Your Safe Journey Partner</p>
      </div>
      <div style="text-align:center; margin-top:20px;">
        <p style="font-size:12px; color:#666;">Scan for ticket verification</p>
        <img src="${qrCode}" style="width:160px; height:160px;" />
      </div>
      <div style="padding: 24px;">
        <h2 style="color:#DC143C;">Booking Confirmed! ✅</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your ticket has been confirmed. Safe travels!</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
        
          <tr style="background:#f5f5f5;"><td style="padding:8px; font-weight:bold;">Ticket No.</td><td style="padding:8px;">${ticketNumber}</td></tr>
          <tr><td style="padding:8px; font-weight:bold;">Route</td><td style="padding:8px;">${route}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding:8px; font-weight:bold;">Date</td><td style="padding:8px;">${date}</td></tr>
          <tr style="background:#f5f5f5;">
          <td style="padding:8px; font-weight:bold;">Departure Time</td>
          <td style="padding:8px;">${departureTime}</td>
          </tr>
          <tr style="background:#f5f5f5;">
            <td style="padding:8px; font-weight:bold;">Passengers</td>
            <td style="padding:8px;">
              <div style="line-height:1.6;">${passengerList}</div>
            </td>
          </tr>
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
      from: `"Shubha Yatra" <${process.env.EMAIL_FROM}>`,
      to, subject: `🎫 Booking Confirmed - ${ticketNumber} | Shubha Yatra`, html
    });
    console.log('📧 [MOCK EMAIL] Ticket sent to:', to, '| MessageId:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
  console.error('❌ Email failed:', err.message);
  return { success: false, error: err.message };
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
  } catch (err) {
  console.error('❌ Email failed:', err.message);
  return { success: false, error: err.message };
}
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  // Make sure the URL is correct
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
  
  console.log('Sending reset email to:', to);
  console.log('Reset URL:', resetUrl);
  console.log('Reset token:', resetToken);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <div style="background: #DC143C; padding: 20px; text-align: center; color: white;">
        <h1 style="margin:0;">🔐 Password Reset</h1>
      </div>
      <div style="padding: 20px;">
        <p>Dear <strong>${name}</strong>,</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #DC143C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="background: #f5f5f5; padding: 10px; word-break: break-all;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Shubha Yatra - शुभ यात्रा</p>
      </div>
    </div>
  `;
  
  try {
    const info = await transporter.sendMail({
      from: `"Shubha Yatra" <${process.env.EMAIL_FROM}>`,
      to,
      subject: '🔐 Reset Your Password - Shubha Yatra',
      html,
    });
    console.log('Reset email sent successfully. MessageId:', info.messageId);
    return { success: true };
  } catch (err) {
    console.error('Failed to send reset email:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Send password reset success email
 */
const sendPasswordResetSuccessEmail = async ({ to, name }) => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <div style="background: #28a745; padding: 20px; text-align: center; color: white;">
        <h1 style="margin:0;">✅ Password Changed Successfully</h1>
      </div>
      <div style="padding: 24px;">
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your password has been successfully changed.</p>
        <p>If you made this change, no further action is required.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="background: #DC143C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
            Login to Your Account
          </a>
        </div>
        <p>शुभ यात्रा! 🙏</p>
      </div>
    </div>
  `;
  
  try {
    await transporter.sendMail({
      from: `"Shubha Yatra" <${process.env.EMAIL_FROM}>`,
      to,
      subject: '✅ Password Changed Successfully',
      html,
    });
  } catch (err) {
    console.error('Failed to send success email:', err);
  }
};

// Add these to your module exports
module.exports = { 
  sendTicketEmail, 
  sendGenericEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
};


