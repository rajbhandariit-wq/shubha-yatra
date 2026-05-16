const { Op } = require('sequelize');
const { Schedule, Bus, Route, Booking, User } = require('../models');
const { sendTicketEmail } = require('../services/emailService');
const { sendTicketSMS } = require('../services/smsService');
const { v4: uuidv4 } = require('uuid');


// Generate ticket number
const generateTicketNumber = () => `SY${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;


// Search buses
exports.searchBuses = async (req, res) => {
  try {
    const { source, destination, date, seats = 1 } = req.query;
    if (!source || !destination || !date) return res.status(400).json({ message: 'Source, destination, and date are required' });

    const schedules = await Schedule.findAll({
      where: {
        travelDate: date,
        status: { [Op.in]: ['scheduled', 'boarding'] },
        availableSeats: { [Op.gte]: parseInt(seats) }
      },
      include: [
        { model: Bus, as: 'bus', where: { isActive: true }, include: [{ model: User, as: 'provider', attributes: ['id', 'name', 'companyName', 'phoneNumber'] }] },
        { model: Route, as: 'route', where: { source: { [Op.iLike]: source }, destination: { [Op.iLike]: destination }, isActive: true } }
      ],
      order: [['departureTime', 'ASC']]
    });

    res.json({ schedules, count: schedules.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get seat layout for a schedule
exports.getSeats = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await Schedule.findByPk(scheduleId, {
      include: [
        { model: Bus, as: 'bus' },
        { model: Route, as: 'route' }
      ]
    });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    // Get booked seats
    const bookings = await Booking.findAll({
      where: { scheduleId, bookingStatus: { [Op.in]: ['confirmed', 'pending'] } },
      attributes: ['seats']
    });
    const bookedSeats = bookings.flatMap(b => b.seats);

    // Generate seat map
    const bus = schedule.bus;
    const totalSeats = bus.totalSeats;
    const layout = bus.seatLayout || { rows: 10, seatsPerRow: 4, layout: '2-2' };
    
    const seats = [];
    for (let i = 1; i <= totalSeats; i++) {
      seats.push({
        number: i,
        label: `${i}`,
        status: bookedSeats.includes(i) ? 'booked' : 'available',
        type: i <= 4 ? 'premium' : 'regular'
      });
    }

    res.json({ schedule, seats, bookedSeats, layout });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const isProviderBooking = req.user.role === 'provider';

    if (isProviderBooking && req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can book on behalf of customers' });
    }
    const { scheduleId, seats, passengerDetails, paymentMethod, boardingPoint, droppingPoint,customerId,customerEmail,customerName,customerPhoneNumber } = req.body;
        // Add validation
    if (!passengerDetails || !Array.isArray(passengerDetails) || passengerDetails.length === 0) {
      return res.status(400).json({ message: 'Passenger details are required' });
    }
    
    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: 'Seat selection is required' });
    }
    const schedule = await Schedule.findByPk(scheduleId, {
      include: [
        { model: Bus, as: 'bus' },
        { model: Route, as: 'route' }
      ]
    });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    if (schedule.status === 'cancelled') return res.status(400).json({ message: 'This schedule has been cancelled' });

    // Check seat availability
    const existingBookings = await Booking.findAll({
      where: { scheduleId, bookingStatus: { [Op.in]: ['confirmed', 'pending'] } }
    });
    const bookedSeats = existingBookings.flatMap(b => b.seats);
    const conflictSeats = seats.filter(s => bookedSeats.includes(s));
    if (conflictSeats.length > 0) return res.status(409).json({ message: `Seats ${conflictSeats.join(', ')} are already booked` });

    const totalAmount = parseFloat(schedule.fare) * seats.length;
    const ticketNumber = generateTicketNumber();

    const booking = await Booking.create({
      ticketNumber,
      customerId: isProviderBooking
        ? null
        : req.user.id,
      scheduleId,
      seats,
      passengerDetails,
      totalAmount,
      paymentStatus: 'paid',
      paymentMethod: paymentMethod || 'card',
      paymentReference: `PAY-${uuidv4().substr(0, 8).toUpperCase()}`,
      bookingStatus: 'confirmed',
      boardingPoint,
      droppingPoint,
      createdByRole: req.user.role,
      createdBy: req.user.id,
      customerName: passengerDetails?.[0]?.name || null,
      customerPhone: req.body.customerPhone || null,
      customerEmail: req.body.customerEmail || req.user.email,
    });

    // Update available seats
    await schedule.update({ availableSeats: schedule.availableSeats - seats.length });

    // Send notifications
    const route = schedule.route;
    const routeName = `${route.source} → ${route.destination}`;
    const dateStr = schedule.travelDate;
    const departureTime = schedule.departureTime ? ` at ${schedule.departureTime}` : '';

    const email = isProviderBooking
      ? req.body.customerEmail
      : req.user.email;
    const name = isProviderBooking ? customerName : req.user.name;
    const phone = isProviderBooking
      ? req.body.customerPhone
      : req.user.phoneNumber;
    if (email) {
      sendTicketEmail({
        to: email,
        name: isProviderBooking ? passengerDetails?.[0]?.name : req.user.name,
        ticketNumber,
        route: routeName,
        date: dateStr,
        departureTime,
        passengers: passengerDetails,
        seats,
        amount: totalAmount
      }).catch(console.error);
    }
    if (phone) {
      sendTicketSMS({ phone, ticketNumber, route: routeName, date: dateStr, departureTime, seats }).catch(console.error);
    }

    const fullBooking = await Booking.findByPk(booking.id, {
      include: [{ model: Schedule, as: 'schedule', include: [{ model: Bus, as: 'bus' }, { model: Route, as: 'route' }] }]
    });

    res.status(201).json({ message: 'Booking confirmed!', booking: fullBooking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get my bookings
exports.getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = { customerId: req.user.id };
    if (status) where.bookingStatus = status;

    const bookings = await Booking.findAndCountAll({
      where,
      include: [{
        model: Schedule, as: 'schedule',
        include: [
          { model: Bus, as: 'bus', include: [{ model: User, as: 'provider', attributes: ['name', 'companyName', 'phoneNumber'] }] },
          { model: Route, as: 'route' }
        ]
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({ bookings: bookings.rows, total: bookings.count, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single booking
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: { id: req.params.id, customerId: req.user.id },
      include: [{ model: Schedule, as: 'schedule', include: [
        { model: Bus, as: 'bus', include: [{ model: User, as: 'provider', attributes: ['name', 'companyName', 'phoneNumber'] }] },
        { model: Route, as: 'route' }
      ]}]
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findOne({
      where: { id: req.params.id, customerId: req.user.id },
      include: [{ model: Schedule, as: 'schedule' }]
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.bookingStatus === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

    const travelDate = new Date(booking.schedule.travelDate);
    const now = new Date();
    const hoursUntilTravel = (travelDate - now) / (1000 * 60 * 60);
    if (hoursUntilTravel < 2) return res.status(400).json({ message: 'Cannot cancel within 2 hours of departure' });

    await booking.update({ bookingStatus: 'cancelled', paymentStatus: 'refunded', cancellationReason: reason || 'Customer cancelled', cancelledAt: new Date() });
    await booking.schedule.update({ availableSeats: booking.schedule.availableSeats + booking.seats.length });

    res.json({ message: 'Booking cancelled and refund initiated', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get popular routes
exports.getPopularRoutes = async (req, res) => {
  try {
    const routes = await Route.findAll({
      where: { isActive: true },
      attributes: ['source', 'destination', 'fare'],
      group: ['source', 'destination', 'fare', 'id'],
      limit: 8
    });
    res.json({ routes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get cities list
exports.getCities = async (req, res) => {
  const cities = [
    'Kathmandu', 'Pokhara', 'Chitwan', 'Lumbini', 'Butwal',
    'Nepalgunj', 'Dharan', 'Biratnagar', 'Janakpur', 'Bhairahawa',
    'Birgunj', 'Hetauda', 'Dhangadhi', 'Mahendranagar', 'Illam',
    'Taplejung', 'Mustang', 'Manang', 'Namche Bazaar', 'Tansen',
    'Palpa', 'Dang', 'Surkhet', 'Jumla', 'Dolpa'
  ];
  res.json({ cities });
};
