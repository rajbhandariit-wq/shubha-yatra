const { Op } = require('sequelize');
const { User, Bus, Route, Booking, Schedule, sequelize } = require('../models');
const { sendTicketEmail } = require('../services/emailService');
const { sendTicketSMS }   = require('../services/smsService');

exports.getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { email: { [Op.iLike]: `%${search}%` } }];

    const users = await User.findAndCountAll({
      where, attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit)
    });
    res.json({ users: users.rows, total: users.count });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.update({ password: newPassword });
    res.json({ message: `Password reset successfully for ${user.email}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot modify admin users' });
    await user.update({ isActive: !user.isActive });
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user: user.toSafeObject() });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin users' });
    await user.update({ isActive: false });
    res.json({ message: 'User deleted (deactivated) successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getDashboard = async (req, res) => {
  try {
    const totalCustomers = await User.count({ where: { role: 'customer' } });
    const totalProviders = await User.count({ where: { role: 'provider' } });
    const totalBookings = await Booking.count();
    const totalRevenue = await Booking.sum('totalAmount', { where: { paymentStatus: 'paid' } });
    const activeBuses = await Bus.count({ where: { isActive: true } });
    const cancelledBookings = await Booking.count({ where: { bookingStatus: 'cancelled' } });

    const recentBookings = await Booking.findAll({
      include: [
        { model: User, as: 'customer', attributes: ['name', 'email'] },
        { model: Schedule, as: 'schedule', include: [{ model: Route, as: 'route' }] }
      ],
      order: [['createdAt', 'DESC']], limit: 10
    });

    res.json({ totalCustomers, totalProviders, totalBookings, totalRevenue: totalRevenue || 0, activeBuses, cancelledBookings, recentBookings });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getCustomerReports = async (req, res) => {
  try {
    const customers = await User.findAll({
      where: { role: 'customer' },
      attributes: { exclude: ['password'] }
    });
    const reports = await Promise.all(customers.map(async (c) => {
      const bookings = await Booking.findAll({ where: { customerId: c.id } });
      const totalSpent = bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
      const cancelled = bookings.filter(b => b.bookingStatus === 'cancelled').length;
      return { customer: c, totalBookings: bookings.length, totalSpent, cancelledBookings: cancelled };
    }));
    res.json({ reports });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getProviderReports = async (req, res) => {
  try {
    const providers = await User.findAll({ where: { role: 'provider' }, attributes: { exclude: ['password'] } });
    const reports = await Promise.all(providers.map(async (p) => {
      const buses = await Bus.findAll({ where: { providerId: p.id } });
      const activeBuses = buses.filter(b => b.isActive).length;
      const busIds = buses.map(b => b.id);
      const schedules = await Schedule.findAll({ where: { busId: { [Op.in]: busIds } }, attributes: ['id'] });
      const scheduleIds = schedules.map(s => s.id);
      const bookings = await Booking.findAll({ where: { scheduleId: { [Op.in]: scheduleIds } } });
      const totalRevenue = bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
      const cancelled = bookings.filter(b => b.bookingStatus === 'cancelled').length;
      const cancellationRate = bookings.length > 0 ? ((cancelled / bookings.length) * 100).toFixed(1) : 0;
      return { provider: p, totalBuses: buses.length, activeBuses, totalBookings: bookings.length, totalRevenue, cancellationRate };
    }));
    res.json({ reports });
  } catch (err) { res.status(500).json({ message: err.message }); }

  
};


exports.getPendingProviders = async (req, res) => {
    const providers = await User.findAll({
      where: {
        role: 'provider',
        status: 'pending'
      }
    });

    res.json(providers);
  };

  exports.approveProvider = async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user || user.role !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    user.status = 'active';
    await user.save();

    res.json({ message: 'Provider approved successfully' });
  };

// ─── Pending bookings (bank transfer approval) ────────────────────────────────

exports.getPendingBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { bookingStatus: 'pending', paymentMethod: 'bank' },
      include: [
        { model: User,     as: 'customer',  attributes: ['name', 'email', 'phoneNumber'] },
        { model: Schedule, as: 'schedule',  include: [{ model: Bus, as: 'bus' }, { model: Route, as: 'route' }] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ bookings, count: bookings.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: User,     as: 'customer' },
        { model: Schedule, as: 'schedule', include: [
          { model: Bus, as: 'bus', include: [{ model: User, as: 'provider', attributes: ['name', 'companyName'] }] },
          { model: Route, as: 'route' },
        ]},
      ],
    });
    if (!booking)                          return res.status(404).json({ message: 'Booking not found' });
    if (booking.bookingStatus !== 'pending') return res.status(400).json({ message: 'Booking is not pending' });

    await booking.update({ bookingStatus: 'confirmed', paymentStatus: 'paid' });

    // Send full ticket via email + SMS
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
    if (booking.customer?.email) {
      sendTicketEmail({ to: booking.customer.email, name: booking.customer.name, ...ticketData }).catch(console.error);
    }
    if (booking.customer?.phoneNumber) {
      sendTicketSMS({ phone: booking.customer.phoneNumber, ...ticketData }).catch(console.error);
    }

    res.json({ message: 'Booking approved and ticket sent to customer', booking });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Schedule, as: 'schedule' }],
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    await booking.update({
      bookingStatus:     'cancelled',
      paymentStatus:     'failed',
      cancellationReason: req.body.reason || 'Bank transfer not verified',
      cancelledAt:       new Date(),
    });
    // Release held seats
    await booking.schedule.update({
      availableSeats: booking.schedule.availableSeats + booking.seats.length,
    });

    res.json({ message: 'Booking rejected and seats released' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

  exports.rejectProvider = async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id);

    user.status = 'rejected';
    await user.save();

    res.json({ message: 'Provider rejected' });
  };