const { Resend } = require('resend');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '../../../frontend/public/images/Android_logo_new.png');
let logoDataUrl = '';
try {
  const logoBuffer = fs.readFileSync(logoPath);
  logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
} catch {
  // logo file not found — email header will fall back to text only
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'noreply@shubha-yatra.com';

const sendTicketEmail = async ({ to, name, ticketNumber, route, date, departureTime, seats = [], amount, passengers = [], busName, busNumber, providerName }) => {
  const passengerList = passengers.length
    ? passengers.map((p, i) => `${i + 1}. ${p.name || p}`).join('<br/>')
    : 'N/A';
  const qrCode = await QRCode.toDataURL(JSON.stringify({ ticketNumber, route, date, departureTime, passengers }));

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 2px solid #DC143C; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #DC143C, #003893); padding: 20px 20px 14px; text-align: center; color: white;">
        ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Shubha Yatra" style="height:80px; width:auto; display:block; margin:0 auto 8px;" />` : ''}
        <h1 style="margin:0; font-size:24px; letter-spacing:1px;">Shubha Yatra</h1>
        <p style="margin:4px 0 12px; font-size:13px; opacity:0.85;">शुभ यात्रा — Your Safe Journey Partner</p>
        <p style="font-size:11px; opacity:0.75; margin:0 0 4px;">Scan for ticket verification</p>
        <img src="${qrCode}" style="width:130px; height:130px; border-radius:8px;" />
      </div>
      <div style="padding: 24px;">
        <h2 style="color:#DC143C;">Booking Confirmed! ✅</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your ticket has been confirmed. Safe travels!</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background:#f5f5f5;"><td style="padding:8px; font-weight:bold; width:40%;">Ticket No.</td><td style="padding:8px; font-family:monospace; font-weight:bold;">${ticketNumber}</td></tr>
          <tr><td style="padding:8px; font-weight:bold;">Route</td><td style="padding:8px;">${route}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding:8px; font-weight:bold;">Date</td><td style="padding:8px;">${date}</td></tr>
          <tr><td style="padding:8px; font-weight:bold;">Departure Time</td><td style="padding:8px;">${departureTime}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding:8px; font-weight:bold;">Seats</td><td style="padding:8px;">${seats.join(', ')}</td></tr>
          <tr><td style="padding:8px; font-weight:bold;">Passengers</td><td style="padding:8px;"><div style="line-height:1.6;">${passengerList}</div></td></tr>
          ${busName   ? `<tr style="background:#f5f5f5;"><td style="padding:8px; font-weight:bold;">Bus</td><td style="padding:8px;">${busName}</td></tr>` : ''}
          ${busNumber ? `<tr><td style="padding:8px; font-weight:bold;">Plate No.</td><td style="padding:8px; font-family:monospace;">${busNumber}</td></tr>` : ''}
          ${providerName ? `<tr style="background:#f5f5f5;"><td style="padding:8px; font-weight:bold;">Operator</td><td style="padding:8px;">${providerName}</td></tr>` : ''}
          <tr><td style="padding:8px; font-weight:bold; color:#DC143C;">Amount Paid</td><td style="padding:8px; font-weight:bold; color:#DC143C;">NPR ${amount}</td></tr>
        </table>
        <p style="color:#666; font-size:12px; margin-top:16px;">Please arrive 15 minutes before departure. शुभ यात्रा! 🙏</p>
      </div>
      <div style="background:#003893; color:white; text-align:center; padding:12px; font-size:12px;">
        © 2025 Shubha Yatra | Nepal's Trusted Bus Booking Platform
      </div>
    </div>`;

  try {
    const { data, error } = await resend.emails.send({
      from: `Shubha Yatra <${FROM}>`,
      to, subject: `🎫 Booking Confirmed - ${ticketNumber} | Shubha Yatra`, html,
    });
    if (error) throw new Error(error.message);
    console.log('📧 Ticket email sent to:', to, '| id:', data.id);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ Email failed:', err.message);
    return { success: false, error: err.message };
  }
};

const sendGenericEmail = async ({ to, subject, message }) => {
  try {
    const { error } = await resend.emails.send({
      from: `Shubha Yatra <${FROM}>`,
      to, subject,
      html: `<div style="font-family:Arial,sans-serif;padding:20px;border-left:4px solid #DC143C;"><h3 style="color:#DC143C;">Shubha Yatra 🚌</h3><p>${message}</p></div>`,
    });
    if (error) throw new Error(error.message);
    console.log('📧 Generic email sent to:', to);
    return { success: true };
  } catch (err) {
    console.error('❌ Email failed:', err.message);
    return { success: false, error: err.message };
  }
};

const sendPendingBankEmail = async ({ to, name, ticketNumber, route, date, departureTime, seats = [], amount, bankDetails }) => {
  const seatList = seats.join(', ');
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:2px solid #f59e0b;border-radius:8px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#92400e,#b45309);padding:20px;text-align:center;color:white;">
        <h1 style="margin:0;font-size:26px;">🔄 Booking Received</h1>
        <p style="margin:5px 0;font-size:13px;">Shubha Yatra — Payment Verification Pending</p>
      </div>
      <div style="padding:24px;">
        <h2 style="color:#b45309;">Hello ${name},</h2>
        <p>We have received your booking. Your <strong>bank transfer is being verified</strong> and your ticket will be issued once the payment is confirmed.</p>
        <p style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;border-radius:4px;font-size:13px;">
          ⏱️ <strong>Expected verification time: 24 hours</strong><br/>
          You will receive your full ticket with QR code once approved.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="background:#f5f5f5;"><td style="padding:8px;font-weight:bold;">Ticket No.</td><td style="padding:8px;font-family:monospace;">${ticketNumber}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Route</td><td style="padding:8px;">${route}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding:8px;font-weight:bold;">Date</td><td style="padding:8px;">${date}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Departure</td><td style="padding:8px;">${departureTime}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding:8px;font-weight:bold;">Seats</td><td style="padding:8px;">${seatList}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Amount Due</td><td style="padding:8px;font-weight:bold;color:#DC143C;">NPR ${amount}</td></tr>
        </table>
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:16px 0;">
          <h3 style="color:#0369a1;margin-top:0;">🏦 Bank Transfer Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;">Bank</td><td style="padding:6px 0;font-weight:bold;">${bankDetails.bankName}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Account Name</td><td style="padding:6px 0;font-weight:bold;">${bankDetails.accountName}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Account Number</td><td style="padding:6px 0;font-family:monospace;font-weight:bold;font-size:15px;">${bankDetails.accountNumber}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">SWIFT</td><td style="padding:6px 0;font-family:monospace;">${bankDetails.swiftCode}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Branch</td><td style="padding:6px 0;">${bankDetails.branch}</td></tr>
            <tr style="border-top:2px solid #bae6fd;"><td style="padding:8px 0;color:#0369a1;font-weight:bold;">Reference No.</td><td style="padding:8px 0;font-family:monospace;font-weight:bold;color:#DC143C;font-size:15px;">${bankDetails.reference}</td></tr>
          </table>
          <p style="font-size:12px;color:#0369a1;margin-bottom:0;">⚠️ Please use the <strong>Reference No.</strong> when making your transfer so we can match it to your booking.</p>
        </div>
        <p style="color:#666;font-size:12px;">If you have already completed the transfer, please allow up to 24 hours for verification. For queries, contact support.</p>
      </div>
      <div style="background:#92400e;color:white;text-align:center;padding:12px;font-size:12px;">
        © 2024 Shubha Yatra | Nepal's Trusted Bus Booking Platform
      </div>
    </div>`;

  try {
    const { data, error } = await resend.emails.send({
      from: `Shubha Yatra <${FROM}>`,
      to, subject: `🔄 Booking Received - ${ticketNumber} | Payment Verification Pending`, html,
    });
    if (error) throw new Error(error.message);
    console.log('📧 Pending bank email sent to:', to);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ Pending email failed:', err.message);
    return { success: false, error: err.message };
  }
};

const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  console.log('Sending reset email to:', to);
  console.log('Reset URL:', resetUrl);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <div style="background: #DC143C; padding: 20px; text-align: center; color: white;">
        <h1 style="margin:0;">🔐 Password Reset</h1>
      </div>
      <div style="padding: 20px;">
        <p>Dear <strong>${name}</strong>,</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #DC143C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
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
    </div>`;

  try {
    const { data, error } = await resend.emails.send({
      from: `Shubha Yatra <${FROM}>`,
      to, subject: '🔐 Reset Your Password - Shubha Yatra', html,
    });
    if (error) throw new Error(error.message);
    console.log('Reset email sent successfully. id:', data.id);
    return { success: true };
  } catch (err) {
    console.error('Failed to send reset email:', err.message);
    return { success: false, error: err.message };
  }
};

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
          <a href="${loginUrl}" style="background: #DC143C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
            Login to Your Account
          </a>
        </div>
        <p>शुभ यात्रा! 🙏</p>
      </div>
    </div>`;

  try {
    const { error } = await resend.emails.send({
      from: `Shubha Yatra <${FROM}>`,
      to, subject: '✅ Password Changed Successfully', html,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error('Failed to send success email:', err.message);
  }
};

module.exports = { sendTicketEmail, sendPendingBankEmail, sendGenericEmail, sendPasswordResetEmail, sendPasswordResetSuccessEmail };
