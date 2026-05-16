const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Booking, Schedule, Bus, Route, User } = require('../models');
const { sendTicketEmail, sendPendingBankEmail } = require('../services/emailService');
const { sendTicketSMS, sendPendingBankSMS }   = require('../services/smsService');
const Stripe = require('stripe');

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured');
  return Stripe(process.env.STRIPE_SECRET_KEY);
};

const ESEWA_MERCHANT  = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST';
const ESEWA_SECRET    = process.env.ESEWA_SECRET_KEY    || '8gBm/:&EnhH.1/q';
const ESEWA_GATEWAY   = process.env.ESEWA_GATEWAY       || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const KHALTI_SECRET   = process.env.KHALTI_SECRET_KEY   || 'test_secret_key_dc74e0fd57cb46cd93832aee0a390234';
const KHALTI_API      = process.env.KHALTI_API          || 'https://a.khalti.com/api/v2';
const FRONTEND_URL    = process.env.FRONTEND_URL        || 'http://localhost:5173';

const genTicket = () => `SY${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2,4).toUpperCase()}`;

// ─── helpers ─────────────────────────────────────────────────────────────────

async function buildPendingBooking(scheduleId, seats, passengerDetails, customerId, paymentMethod, transactionId) {
  const schedule = await Schedule.findByPk(scheduleId, {
    include: [{ model: Bus, as: 'bus', include: [{ model: User, as: 'provider', attributes: ['name', 'companyName', 'phoneNumber'] }] }, { model: Route, as: 'route' }]
  });
  if (!schedule) throw new Error('Schedule not found');

  const existing = await Booking.findAll({
    where: { scheduleId, bookingStatus: { [Op.in]: ['confirmed', 'pending'] } }
  });
  const booked   = existing.flatMap(b => b.seats);
  const conflict = seats.filter(s => booked.includes(s));
  if (conflict.length) throw new Error(`Seats ${conflict.join(', ')} are already booked`);

  const totalAmount = parseFloat(schedule.fare) * seats.length;
  const booking = await Booking.create({
    ticketNumber:     genTicket(),
    customerId,
    scheduleId,
    seats,
    passengerDetails,
    totalAmount,
    paymentStatus:    'pending',
    paymentMethod,
    paymentReference: transactionId,
    bookingStatus:    'pending',
    boardingPoint:    schedule.route?.source,
    droppingPoint:    schedule.route?.destination,
  });

  await schedule.update({ availableSeats: schedule.availableSeats - seats.length });
  return { booking, schedule, totalAmount };
}

async function confirmBookings(bookingIds, paymentReference) {
  const bookings = await Booking.findAll({
    where: { id: { [Op.in]: bookingIds } },
    include: [{ model: Schedule, as: 'schedule', include: [{ model: Bus, as: 'bus', include: [{ model: User, as: 'provider', attributes: ['name', 'companyName', 'phoneNumber'] }] }, { model: Route, as: 'route' }] }]
  });

  await Promise.all(bookings.map(b => b.update({
    paymentStatus: 'paid',
    bookingStatus: 'confirmed',
    paymentReference,
  })));

  for (const booking of bookings) {
    const user = await User.findByPk(booking.customerId);
    const ticketData = {
      ticketNumber:  booking.ticketNumber,
      route:         `${booking.schedule.route.source} → ${booking.schedule.route.destination}`,
      date:          booking.schedule.travelDate,
      departureTime: booking.schedule.departureTime,
      seats:         booking.seats,
      passengers:    booking.passengerDetails,
      amount:        booking.totalAmount,
      busName:       booking.schedule.bus?.name,
      busNumber:     booking.schedule.bus?.registrationNumber,
      providerName:  booking.schedule.bus?.provider?.companyName || booking.schedule.bus?.provider?.name,
    };
    if (user?.email) {
      sendTicketEmail({ to: user.email, name: user.name, ...ticketData }).catch(console.error);
    }
    if (user?.phoneNumber) {
      sendTicketSMS({ phone: user.phoneNumber, ...ticketData }).catch(console.error);
    }
  }

  return bookings;
}

async function cancelBookings(bookingIds) {
  const bookings = await Booking.findAll({
    where: { id: { [Op.in]: bookingIds } },
    include: [{ model: Schedule, as: 'schedule' }]
  });
  await Promise.all(bookings.map(async b => {
    await b.update({ bookingStatus: 'cancelled', paymentStatus: 'failed' });
    await b.schedule.update({ availableSeats: b.schedule.availableSeats + b.seats.length });
  }));
}

// ─── eSewa ────────────────────────────────────────────────────────────────────

exports.initiateEsewa = async (req, res) => {
  try {
    const { bookings: bookingRequests = [] } = req.body; // [{ scheduleId, seats, passengerDetails }]
    const customerId    = req.user.id;
    const transactionId = uuidv4();

    let totalAmount = 0;
    const createdBookings = [];

    for (const br of bookingRequests) {
      const result = await buildPendingBooking(
        br.scheduleId, br.seats, br.passengerDetails, customerId, 'esewa', transactionId
      );
      totalAmount += result.totalAmount;
      createdBookings.push(result.booking);
    }

    const bookingIds = createdBookings.map(b => b.id).join(',');

    const message   = `total_amount=${totalAmount},transaction_uuid=${transactionId},product_code=${ESEWA_MERCHANT}`;
    const signature = crypto.createHmac('sha256', ESEWA_SECRET).update(message).digest('base64');

    res.json({
      bookingIds: createdBookings.map(b => b.id),
      gatewayUrl: ESEWA_GATEWAY,
      params: {
        amount:                   totalAmount,
        tax_amount:               0,
        total_amount:             totalAmount,
        transaction_uuid:         transactionId,
        product_code:             ESEWA_MERCHANT,
        product_service_charge:   0,
        product_delivery_charge:  0,
        success_url: `${FRONTEND_URL}/payment/callback?gateway=esewa&bookingIds=${bookingIds}`,
        failure_url: `${FRONTEND_URL}/payment/failed?gateway=esewa&bookingIds=${bookingIds}`,
        signed_field_names:       'total_amount,transaction_uuid,product_code',
        signature,
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.verifyEsewa = async (req, res) => {
  try {
    const { data, bookingIds } = req.body; // data = base64 from eSewa, bookingIds = array
    const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));

    if (decoded.status !== 'COMPLETE') {
      await cancelBookings(bookingIds);
      return res.status(400).json({ message: 'eSewa payment not completed', decoded });
    }

    // Verify signature from eSewa response
    const fields   = decoded.signed_field_names.split(',');
    const msg      = fields.map(f => `${f}=${decoded[f]}`).join(',');
    const expected = crypto.createHmac('sha256', ESEWA_SECRET).update(msg).digest('base64');
    if (expected !== decoded.signature) {
      await cancelBookings(bookingIds);
      return res.status(400).json({ message: 'eSewa signature mismatch' });
    }

    const bookings = await confirmBookings(bookingIds, decoded.transaction_code || decoded.transaction_uuid);

    const fullBookings = await Booking.findAll({
      where: { id: { [Op.in]: bookingIds } },
      include: [{ model: Schedule, as: 'schedule', include: [{ model: Bus, as: 'bus', include: [{ model: User, as: 'provider', attributes: ['name', 'companyName', 'phoneNumber'] }] }, { model: Route, as: 'route' }] }]
    });

    res.json({ success: true, bookings: fullBookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Khalti ───────────────────────────────────────────────────────────────────

exports.initiateKhalti = async (req, res) => {
  try {
    const { bookings: bookingRequests = [] } = req.body;
    const user          = req.user;
    const transactionId = uuidv4();

    let totalAmount = 0;
    const createdBookings = [];

    for (const br of bookingRequests) {
      const result = await buildPendingBooking(
        br.scheduleId, br.seats, br.passengerDetails, user.id, 'khalti', transactionId
      );
      totalAmount += result.totalAmount;
      createdBookings.push(result.booking);
    }

    const bookingIds = createdBookings.map(b => b.id);

    const resp = await fetch(`${KHALTI_API}/epayment/initiate/`, {
      method:  'POST',
      headers: { 'Authorization': `Key ${KHALTI_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        return_url:           `${FRONTEND_URL}/payment/callback?gateway=khalti&bookingIds=${bookingIds.join(',')}`,
        website_url:          FRONTEND_URL,
        amount:               Math.round(totalAmount * 100), // paisa
        purchase_order_id:    transactionId,
        purchase_order_name:  `Shubha Yatra Ticket`,
        customer_info: {
          name:  user.name  || bookingRequests[0]?.passengerDetails?.[0]?.name || 'Customer',
          email: user.email || '',
          phone: user.phoneNumber || '9800000000',
        },
      }),
    });

    const data = await resp.json();
    if (!data.payment_url) {
      await cancelBookings(bookingIds);
      return res.status(400).json({ message: data.detail || data.error_key || 'Khalti initiation failed', raw: data });
    }

    res.json({ bookingIds, paymentUrl: data.payment_url, pidx: data.pidx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyKhalti = async (req, res) => {
  try {
    const { pidx, bookingIds } = req.body;

    const resp = await fetch(`${KHALTI_API}/epayment/lookup/`, {
      method:  'POST',
      headers: { 'Authorization': `Key ${KHALTI_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pidx }),
    });
    const data = await resp.json();

    if (data.status !== 'Completed') {
      await cancelBookings(bookingIds);
      return res.status(400).json({ message: `Khalti payment status: ${data.status}`, raw: data });
    }

    await confirmBookings(bookingIds, data.transaction_id);

    const fullBookings = await Booking.findAll({
      where: { id: { [Op.in]: bookingIds } },
      include: [{ model: Schedule, as: 'schedule', include: [{ model: Bus, as: 'bus', include: [{ model: User, as: 'provider', attributes: ['name', 'companyName', 'phoneNumber'] }] }, { model: Route, as: 'route' }] }]
    });

    res.json({ success: true, bookings: fullBookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Cancel / release seats ──────────────────────────────────────────────────

exports.cancelPayment = async (req, res) => {
  try {
    const { bookingIds } = req.body;
    if (bookingIds?.length) await cancelBookings(bookingIds);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Stripe ───────────────────────────────────────────────────────────────────

exports.createStripeIntent = async (req, res) => {
  try {
    const { bookings: bookingRequests = [] } = req.body;
    const customerId    = req.user.id;
    const transactionId = uuidv4();

    let totalAmount = 0;
    const createdBookings = [];

    for (const br of bookingRequests) {
      const result = await buildPendingBooking(
        br.scheduleId, br.seats, br.passengerDetails, customerId, 'card', transactionId
      );
      totalAmount += result.totalAmount;
      createdBookings.push(result.booking);
    }

    const bookingIds = createdBookings.map(b => b.id);

    // Stripe does not support NPR; use USD for sandbox testing
    const intent = await getStripe().paymentIntents.create({
      amount:   Math.round(totalAmount), // treating NPR amount as cents for sandbox
      currency: 'usd',
      metadata: { bookingIds: bookingIds.join(','), customerId },
    });

    res.json({ clientSecret: intent.client_secret, bookingIds, amount: totalAmount });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.confirmStripe = async (req, res) => {
  try {
    const { paymentIntentId, bookingIds } = req.body;

    const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded') {
      await cancelBookings(bookingIds);
      return res.status(400).json({ message: `Payment not completed (status: ${intent.status})` });
    }

    await confirmBookings(bookingIds, paymentIntentId);

    const fullBookings = await Booking.findAll({
      where: { id: { [Op.in]: bookingIds } },
      include: [{ model: Schedule, as: 'schedule', include: [{ model: Bus, as: 'bus', include: [{ model: User, as: 'provider', attributes: ['name', 'companyName', 'phoneNumber'] }] }, { model: Route, as: 'route' }] }]
    });

    res.json({ success: true, bookings: fullBookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Card (legacy mock — kept for non-Stripe fallback) ────────────────────────
exports.payByCard = async (req, res) => {
  try {
    const { bookings: bookingRequests = [] } = req.body;
    const customerId = req.user.id;
    const ref        = `CARD-${uuidv4().substr(0,8).toUpperCase()}`;

    const created = [];
    for (const br of bookingRequests) {
      const { booking } = await buildPendingBooking(
        br.scheduleId, br.seats, br.passengerDetails, customerId, 'card', ref
      );
      created.push(booking.id);
    }

    await confirmBookings(created, ref);

    const full = await Booking.findAll({
      where: { id: { [Op.in]: created } },
      include: [{ model: Schedule, as: 'schedule', include: [{ model: Bus, as: 'bus', include: [{ model: User, as: 'provider', attributes: ['name', 'companyName', 'phoneNumber'] }] }, { model: Route, as: 'route' }] }]
    });

    res.status(201).json({ success: true, bookings: full });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ─── Bank Transfer (pending) ──────────────────────────────────────────────────
exports.payByBank = async (req, res) => {
  try {
    const { bookings: bookingRequests = [] } = req.body;
    const customerId = req.user.id;
    const ref        = `BANK-${Date.now().toString(36).toUpperCase()}`;

    const created = [];
    for (const br of bookingRequests) {
      const { booking } = await buildPendingBooking(
        br.scheduleId, br.seats, br.passengerDetails, customerId, 'bank', ref
      );
      created.push(booking.id);
    }

    const bankDetails = {
      bankName:      'NABIL Bank Ltd.',
      accountName:   'Shubha Yatra Pvt. Ltd.',
      accountNumber: '1234567890123',
      swiftCode:     'NARBNPKA',
      branch:        'New Road, Kathmandu',
      reference:     ref,
    };

    const full = await Booking.findAll({
      where: { id: { [Op.in]: created } },
      include: [{ model: Schedule, as: 'schedule', include: [{ model: Bus, as: 'bus', include: [{ model: User, as: 'provider', attributes: ['name', 'companyName', 'phoneNumber'] }] }, { model: Route, as: 'route' }] }]
    });

    // Send pending email + SMS to customer for each booking
    for (const booking of full) {
      const user = await User.findByPk(booking.customerId);
      const common = {
        ticketNumber:  booking.ticketNumber,
        route:         `${booking.schedule.route.source} → ${booking.schedule.route.destination}`,
        date:          booking.schedule.travelDate,
        departureTime: booking.schedule.departureTime,
        seats:         booking.seats,
        amount:        booking.totalAmount,
      };
      if (user?.email) {
        sendPendingBankEmail({ to: user.email, name: user.name, ...common, bankDetails }).catch(console.error);
      }
      if (user?.phoneNumber) {
        sendPendingBankSMS({ phone: user.phoneNumber, ...common, reference: bankDetails.reference }).catch(console.error);
      }
    }

    res.status(201).json({ success: true, bookings: full, reference: ref, bankDetails });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
