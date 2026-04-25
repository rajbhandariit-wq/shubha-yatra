const { Op } = require('sequelize');
const { Bus, Route, Schedule, Booking, Staff, User, Notification } = require('../models');
const { sendGenericEmail } = require('../services/emailService');
const { sendAlertSMS } = require('../services/smsService');

// ============ DASHBOARD ============
exports.getDashboard = async (req, res) => {
  try {
    const providerId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const buses = await Bus.findAll({ where: { providerId, isActive: true } });
    const busIds = buses.map(b => b.id);
    const routes = await Route.findAll({ where: { providerId, isActive: true } });
    const routeIds = routes.map(r => r.id);

    const todaySchedules = await Schedule.findAll({
      where: { busId: { [Op.in]: busIds }, routeId: { [Op.in]: routeIds }, travelDate: today },
      include: [{ model: Bus, as: 'bus' }, { model: Route, as: 'route' }]
    });

    const upcomingBookings = await Booking.findAll({
      where: { bookingStatus: 'confirmed' },
      include: [{
        model: Schedule, as: 'schedule',
        where: { busId: { [Op.in]: busIds }, travelDate: { [Op.gte]: today } },
        include: [{ model: Route, as: 'route' }]
      }, { model: User, as: 'customer', attributes: ['name', 'email', 'phone'] }],
      limit: 10, order: [[{ model: Schedule, as: 'schedule' }, 'travelDate', 'ASC']]
    });

    const totalRevenue = await Booking.sum('totalAmount', {
      where: { bookingStatus: { [Op.in]: ['confirmed', 'completed'] }, paymentStatus: 'paid' },
      include: [{ model: Schedule, as: 'schedule', where: { busId: { [Op.in]: busIds } }, required: true }]
    });

    res.json({ todaySchedules, upcomingBookings, totalRevenue: totalRevenue || 0, activeBuses: buses.length, activeRoutes: routes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============ BUS MANAGEMENT ============
exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.findAll({ where: { providerId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json({ buses });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createBus = async (req, res) => {
  try {
    const { name, registrationNumber, type, totalSeats, seatLayout, amenities } = req.body;
    const bus = await Bus.create({ providerId: req.user.id, name, registrationNumber, type, totalSeats, seatLayout, amenities });
    res.status(201).json({ message: 'Bus added successfully', bus });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateBus = async (req, res) => {
  try {
    const bus = await Bus.findOne({ where: { id: req.params.id, providerId: req.user.id } });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    await bus.update(req.body);
    res.json({ message: 'Bus updated', bus });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findOne({ where: { id: req.params.id, providerId: req.user.id } });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    await bus.update({ isActive: false });
    res.json({ message: 'Bus deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ============ ROUTE MANAGEMENT ============
exports.getRoutes = async (req, res) => {
  try {
    const routes = await Route.findAll({ where: { providerId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json({ routes });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createRoute = async (req, res) => {
  try {
    const { source, destination, distance, estimatedDuration, fare, departureTime, arrivalTime, stops, daysOfWeek } = req.body;
    const route = await Route.create({ providerId: req.user.id, source, destination, distance, estimatedDuration, fare, departureTime, arrivalTime, stops, daysOfWeek });
    res.status(201).json({ message: 'Route created', route });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateRoute = async (req, res) => {
  try {
    const route = await Route.findOne({ where: { id: req.params.id, providerId: req.user.id } });
    if (!route) return res.status(404).json({ message: 'Route not found' });
    await route.update(req.body);
    res.json({ message: 'Route updated', route });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteRoute = async (req, res) => {
  try {
    const route = await Route.findOne({ where: { id: req.params.id, providerId: req.user.id } });
    if (!route) return res.status(404).json({ message: 'Route not found' });
    await route.update({ isActive: false });
    res.json({ message: 'Route deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ============ SCHEDULE MANAGEMENT ============
exports.createSchedule = async (req, res) => {
  try {
    const { busId, routeId, travelDate, departureTime, arrivalTime, fare } = req.body;
    const bus = await Bus.findOne({ where: { id: busId, providerId: req.user.id } });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    const schedule = await Schedule.create({ busId, routeId, travelDate, departureTime, arrivalTime, fare, availableSeats: bus.totalSeats });
    res.status(201).json({ message: 'Schedule created', schedule });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getSchedules = async (req, res) => {
  try {
    const buses = await Bus.findAll({ where: { providerId: req.user.id }, attributes: ['id'] });
    const busIds = buses.map(b => b.id);
    const schedules = await Schedule.findAll({
      where: { busId: { [Op.in]: busIds } },
      include: [{ model: Bus, as: 'bus' }, { model: Route, as: 'route' }],
      order: [['travelDate', 'DESC'], ['departureTime', 'ASC']]
    });
    res.json({ schedules });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ============ BOOKINGS ============
exports.getBookings = async (req, res) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 20 } = req.query;
    const buses = await Bus.findAll({ where: { providerId: req.user.id }, attributes: ['id'] });
    const busIds = buses.map(b => b.id);

    const scheduleWhere = { busId: { [Op.in]: busIds } };
    if (startDate) scheduleWhere.travelDate = { [Op.gte]: startDate };
    if (endDate) scheduleWhere.travelDate = { ...scheduleWhere.travelDate, [Op.lte]: endDate };

    const bookingWhere = {};
    if (status) bookingWhere.bookingStatus = status;

    const bookings = await Booking.findAndCountAll({
      where: bookingWhere,
      include: [
        { model: Schedule, as: 'schedule', where: scheduleWhere, include: [{ model: Bus, as: 'bus' }, { model: Route, as: 'route' }] },
        { model: User, as: 'customer', attributes: ['name', 'email', 'phone'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit)
    });
    res.json({ bookings: bookings.rows, total: bookings.count });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ============ STAFF ============
exports.getStaff = async (req, res) => {
  try {
    const staff = await Staff.findAll({ where: { providerId: req.user.id }, order: [['name', 'ASC']] });
    res.json({ staff });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createStaff = async (req, res) => {
  try {
    const staff = await Staff.create({ ...req.body, providerId: req.user.id });
    res.status(201).json({ message: 'Staff added', staff });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({ where: { id: req.params.id, providerId: req.user.id } });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    await staff.update(req.body);
    res.json({ message: 'Staff updated', staff });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({ where: { id: req.params.id, providerId: req.user.id } });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    await staff.update({ isActive: false });
    res.json({ message: 'Staff deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ============ MESSAGING ============
exports.sendMessage = async (req, res) => {
  try {
    const { type, subject, message, scheduleId, recipientType } = req.body;
    const buses = await Bus.findAll({ where: { providerId: req.user.id }, attributes: ['id'] });
    const busIds = buses.map(b => b.id);

    let recipients = [];
    if (scheduleId) {
      const bookings = await Booking.findAll({
        where: { scheduleId, bookingStatus: { [Op.in]: ['confirmed'] } },
        include: [{ model: User, as: 'customer', attributes: ['name', 'email', 'phone'] }]
      });
      recipients = bookings.map(b => ({ name: b.customer.name, email: b.customer.email, phone: b.customer.phone }));
    }

    if (type === 'Email' || type === 'Both') {
      for (const r of recipients) {
        if (r.email) sendGenericEmail({ to: r.email, subject: subject || 'Important Notice from Shubha Yatra', message }).catch(console.error);
      }
    }
    if (type === 'SMS' || type === 'Both') {
      const phones = recipients.filter(r => r.phone).map(r => r.phone);
      if (phones.length > 0) sendAlertSMS({ phones, message }).catch(console.error);
    }

    const notification = await Notification.create({
      senderId: req.user.id, type, subject, message,
      recipients: recipients.map(r => ({ email: r.email, phone: r.phone })),
      scheduleId: scheduleId || null, status: 'sent'
    });

    res.json({ message: `Message sent to ${recipients.length} recipients`, notification });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({ where: { senderId: req.user.id }, order: [['createdAt', 'DESC']], limit: 50 });
    res.json({ notifications });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ============ REPORTS ============
exports.getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const buses = await Bus.findAll({ where: { providerId: req.user.id } });
    const busIds = buses.map(b => b.id);

    const scheduleWhere = { busId: { [Op.in]: busIds } };
    if (startDate && endDate) scheduleWhere.travelDate = { [Op.between]: [startDate, endDate] };

    // Sales by bus
    const salesByBus = await Promise.all(buses.map(async bus => {
      const schedules = await Schedule.findAll({ where: { busId: bus.id }, attributes: ['id'] });
      const scheduleIds = schedules.map(s => s.id);
      const bookings = await Booking.findAll({
        where: { scheduleId: { [Op.in]: scheduleIds }, bookingStatus: { [Op.in]: ['confirmed', 'completed'] } },
        attributes: ['totalAmount', 'seats']
      });
      const revenue = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
      const passengers = bookings.reduce((sum, b) => sum + b.seats.length, 0);
      return { bus: { id: bus.id, name: bus.name, type: bus.type }, revenue, bookings: bookings.length, passengers };
    }));

    // Sales by route
    const routes = await Route.findAll({ where: { providerId: req.user.id } });
    const salesByRoute = await Promise.all(routes.map(async route => {
      const schedules = await Schedule.findAll({ where: { routeId: route.id }, attributes: ['id'] });
      const scheduleIds = schedules.map(s => s.id);
      const bookings = await Booking.findAll({
        where: { scheduleId: { [Op.in]: scheduleIds }, bookingStatus: { [Op.in]: ['confirmed', 'completed'] } }
      });
      const revenue = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
      return { route: { source: route.source, destination: route.destination, fare: route.fare }, revenue, bookings: bookings.length };
    }));

    const totalRevenue = salesByBus.reduce((sum, b) => sum + b.revenue, 0);
    const totalBookings = salesByBus.reduce((sum, b) => sum + b.bookings, 0);

    res.json({ salesByBus, salesByRoute, totalRevenue, totalBookings });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
