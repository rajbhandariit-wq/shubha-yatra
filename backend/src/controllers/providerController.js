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

    const allSchedules = await Schedule.findAll({ where: { busId: { [Op.in]: busIds } }, attributes: ['id'] });
    const scheduleIds = allSchedules.map(s => s.id);

    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];

    const upcomingBookings = await Booking.findAll({
      where: { bookingStatus: 'confirmed' },
      include: [{
        model: Schedule, 
        as: 'schedule',
        where: { 
          busId: { [Op.in]: busIds }, 
          travelDate: { [Op.gte]: today, [Op.lte]: thirtyDaysLaterStr } 
        },
        include: [{ model: Route, as: 'route' }]
      }, { 
        model: User, 
        as: 'customer', 
        attributes: ['id', 'name', 'email', 'phoneNumber']
      }],
      limit: 10,
      order: [[{ model: Schedule, as: 'schedule' }, 'travelDate', 'ASC']]
    });

    const upcomingBookingsCount = await Booking.count({
      where: { bookingStatus: 'confirmed' },
      include: [{
        model: Schedule, 
        as: 'schedule',
        where: { 
          busId: { [Op.in]: busIds }, 
          travelDate: { [Op.gte]: today, [Op.lte]: thirtyDaysLaterStr } 
        },
        required: true
      }]
    });

    const totalRevenue = scheduleIds.length > 0
      ? await Booking.sum('totalAmount', {
          where: {
            scheduleId: { [Op.in]: scheduleIds },
            bookingStatus: { [Op.in]: ['confirmed', 'completed'] },
            paymentStatus: 'paid'
          }
        })
      : 0;

    res.json({ 
      todaySchedules, 
      upcomingBookings, 
      upcomingBookingsCount, 
      totalRevenue: totalRevenue || 0, 
      activeBuses: buses.length, 
      activeRoutes: routes.length 
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ============ BUS MANAGEMENT ============
exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.findAll({ where: { providerId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json({ buses });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

exports.createBus = async (req, res) => {
  try {
    const { name, registrationNumber, type, totalSeats, seatLayout, amenities } = req.body;
    const bus = await Bus.create({ providerId: req.user.id, name, registrationNumber, type, totalSeats, seatLayout, amenities });
    res.status(201).json({ message: 'Bus added successfully', bus });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

exports.updateBus = async (req, res) => {
  try {
    const bus = await Bus.findOne({ where: { id: req.params.id, providerId: req.user.id } });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    await bus.update(req.body);
    res.json({ message: 'Bus updated', bus });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

exports.deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findOne({ where: { id: req.params.id, providerId: req.user.id } });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    await bus.update({ isActive: false });
    res.json({ message: 'Bus deactivated' });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

// ============ ROUTE MANAGEMENT ============
exports.getRoutes = async (req, res) => {
  try {
    const routes = await Route.findAll({ where: { providerId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json({ routes });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

exports.createRoute = async (req, res) => {
  try {
    const { source, destination, distance, estimatedDuration, fare, departureTime, arrivalTime, stops, daysOfWeek } = req.body;
    const route = await Route.create({ providerId: req.user.id, source, destination, distance, estimatedDuration, fare, departureTime, arrivalTime, stops, daysOfWeek });
    res.status(201).json({ message: 'Route created', route });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const route = await Route.findOne({ where: { id: req.params.id, providerId: req.user.id } });
    if (!route) return res.status(404).json({ message: 'Route not found' });
    await route.update(req.body);
    res.json({ message: 'Route updated', route });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const route = await Route.findOne({ where: { id: req.params.id, providerId: req.user.id } });
    if (!route) return res.status(404).json({ message: 'Route not found' });
    await route.update({ isActive: false });
    res.json({ message: 'Route deactivated' });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

// ============ SCHEDULE MANAGEMENT ============
exports.createSchedule = async (req, res) => {
  try {
    const { busId, routeId, travelDate, departureTime, arrivalTime, fare } = req.body;
    const bus = await Bus.findOne({ where: { id: busId, providerId: req.user.id, isActive: true } });
    if (!bus) return res.status(404).json({ message: 'Bus not found or is deactivated. Please select an active bus.' });
    const route = await Route.findOne({ where: { id: routeId, isActive: true } });
    if (!route) return res.status(404).json({ message: 'Route not found or is deactivated. Please select an active route.' });
    const cleanDate = typeof travelDate === 'string' ? travelDate.split('T')[0] : travelDate;
    const schedule = await Schedule.create({ busId, routeId, travelDate: cleanDate, departureTime, arrivalTime, fare, availableSeats: bus.totalSeats });
    res.status(201).json({ message: 'Schedule created', schedule });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBulkSchedules = async (req, res) => {
  try {
    const { busId, routeId, startDate, endDate, daysOfWeek, departureTime, arrivalTime, fare, dayOverrides = {} } = req.body;
    if (!busId || !routeId || !startDate || !endDate || !daysOfWeek?.length) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const bus = await Bus.findOne({ where: { id: busId, providerId: req.user.id, isActive: true } });
    if (!bus) return res.status(404).json({ message: 'Bus not found or is deactivated. Please select an active bus.' });

    const records = [];
    const end = new Date(endDate);
    const cur = new Date(startDate);
    while (cur <= end) {
      const day = cur.getUTCDay();
      if (daysOfWeek.includes(day)) {
        const ov = dayOverrides[day] || {};
        records.push({
          busId, routeId,
          travelDate: cur.toISOString().split('T')[0],
          departureTime: ov.departureTime || departureTime,
          arrivalTime: ov.arrivalTime || arrivalTime,
          fare,
          availableSeats: bus.totalSeats,
        });
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    if (records.length === 0) {
      return res.status(400).json({ message: 'No dates match the selected days in the given range' });
    }
    await Schedule.bulkCreate(records, { ignoreDuplicates: true });
    res.status(201).json({ message: `${records.length} schedules created`, count: records.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
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
        { model: User, as: 'customer', attributes: ['name', 'email', 'phoneNumber'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit), 
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    res.json({ bookings: bookings.rows, total: bookings.count });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

// ============ STAFF ============
exports.getStaff = async (req, res) => {
  try {
    const staff = await Staff.findAll({ where: { providerId: req.user.id }, order: [['name', 'ASC']] });
    res.json({ staff });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

const sanitizeStaffDates = (body) => ({
  ...body,
  licenseExpiry: body.licenseExpiry || null,
  joiningDate:   body.joiningDate   || null,
  salary:        body.salary        || null,
});

exports.createStaff = async (req, res) => {
  try {
    const staff = await Staff.create({ ...sanitizeStaffDates(req.body), providerId: req.user.id });
    res.status(201).json({ message: 'Staff added', staff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({ where: { id: req.params.id, providerId: req.user.id } });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    await staff.update(sanitizeStaffDates(req.body));
    res.json({ message: 'Staff updated', staff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({ where: { id: req.params.id, providerId: req.user.id } });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    await staff.update({ isActive: false });
    res.json({ message: 'Staff deactivated' });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
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
        include: [{ model: User, as: 'customer', attributes: ['name', 'email', 'phoneNumber'] }]
      });
      recipients = bookings.map(b => ({ name: b.customer.name, email: b.customer.email, phoneNumber: b.customer.phoneNumber }));
    }

    if (type === 'Email' || type === 'Both') {
      for (const r of recipients) {
        if (r.email) sendGenericEmail({ to: r.email, subject: subject || 'Important Notice from Shubha Yatra', message }).catch(console.error);
      }
    }
    if (type === 'SMS' || type === 'Both') {
      const phones = recipients.filter(r => r.phoneNumber).map(r => r.phoneNumber);
      if (phones.length > 0) sendAlertSMS({ phones, message }).catch(console.error);
    }

    const notification = await Notification.create({
      senderId: req.user.id, type, subject, message,
      recipients: recipients.map(r => ({ email: r.email, phoneNumber: r.phoneNumber })),
      scheduleId: scheduleId || null, status: 'sent'
    });

    res.json({ message: `Message sent to ${recipients.length} recipients`, notification });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({ where: { senderId: req.user.id }, order: [['createdAt', 'DESC']], limit: 50 });
    res.json({ notifications });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
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
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }

};

// Add these functions to your providerController.js (before the module.exports)

// ============ ADD THESE MISSING FUNCTIONS ============

// Search schedules for manual booking
exports.searchSchedules = async (req, res) => {
  try {
    const { source, destination, date } = req.query;
    const providerId = req.user.id;

    if (!source || !destination || !date) {
      return res.status(400).json({ message: 'Source, destination, and date are required' });
    }

    // Get provider's buses
    const buses = await Bus.findAll({ 
      where: { providerId, isActive: true },
      attributes: ['id']
    });
    const busIds = buses.map(b => b.id);

    if (busIds.length === 0) {
      return res.json({ schedules: [] });
    }

    // Find schedules
    const schedules = await Schedule.findAll({
      where: {
        busId: { [Op.in]: busIds },
        travelDate: date,
        availableSeats: { [Op.gt]: 0 }
      },
      include: [
        { 
          model: Bus, 
          as: 'bus',
          where: { isActive: true }
        },
        { 
          model: Route, 
          as: 'route',
          where: {
            source: { [Op.iLike]: source },
            destination: { [Op.iLike]: destination },
            isActive: true
          }
        }
      ],
      order: [['departureTime', 'ASC']]
    });

    res.json({ schedules });
  } catch (err) {
    console.error('Search schedules error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get seat layout for a schedule
exports.getSeatLayout = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const providerId = req.user.id;

    // Verify schedule belongs to provider
    const schedule = await Schedule.findByPk(scheduleId, {
      include: [
        { 
          model: Bus, 
          as: 'bus',
          where: { providerId }
        },
        { model: Route, as: 'route' }
      ]
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Get booked seats
    const bookings = await Booking.findAll({
      where: { 
        scheduleId, 
        bookingStatus: { [Op.in]: ['confirmed', 'pending'] }
      },
      attributes: ['seats']
    });

    const bookedSeats = bookings.flatMap(b => b.seats);

    const bus = schedule.bus;
    const storedLayout = bus.seatLayout;
    let seats;
    let layout;

    if (storedLayout?.seats?.length > 0) {
      seats = storedLayout.seats.map(s => ({
        ...s,
        status: bookedSeats.includes(s.number) ? 'booked' : 'available',
      }));
      layout = { leftCols: storedLayout.leftCols, rightCols: storedLayout.rightCols };
    } else {
      seats = [];
      for (let i = 1; i <= bus.totalSeats; i++) {
        seats.push({ number: i, label: `${i}`, status: bookedSeats.includes(i) ? 'booked' : 'available' });
      }
      layout = null;
    }

    res.json({ schedule, seats, bookedSeats, layout, fare: schedule.fare });
  } catch (err) {
    console.error('Get seat layout error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Create manual booking (by provider/admin)
exports.createManualBooking = async (req, res) => {
  try {
    const { 
      scheduleId, 
      seats, 
      passengerDetails, 
      paymentMethod, 
      boardingPoint, 
      droppingPoint,
      customerEmail,
      customerName,
      customerPhone
    } = req.body;

    // Validate required fields
    if (!scheduleId) {
      return res.status(400).json({ message: 'Schedule ID is required' });
    }

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: 'At least one seat is required' });
    }

    if (!passengerDetails || !Array.isArray(passengerDetails) || passengerDetails.length === 0) {
      return res.status(400).json({ message: 'Passenger details are required' });
    }

    if (seats.length !== passengerDetails.length) {
      return res.status(400).json({ message: 'Number of seats and passengers do not match' });
    }

    // Get schedule with bus info
    const schedule = await Schedule.findByPk(scheduleId, {
      include: [
        { 
          model: Bus, 
          as: 'bus',
          where: { providerId: req.user.id }
        },
        { model: Route, as: 'route' }
      ]
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check seat availability
    const existingBookings = await Booking.findAll({
      where: { 
        scheduleId, 
        bookingStatus: { [Op.in]: ['confirmed', 'pending'] }
      }
    });

    const bookedSeats = existingBookings.flatMap(b => b.seats);
    const conflictSeats = seats.filter(s => bookedSeats.includes(s));

    if (conflictSeats.length > 0) {
      return res.status(409).json({ 
        message: `Seats ${conflictSeats.join(', ')} are already booked` 
      });
    }

    // Calculate total amount
    const totalAmount = parseFloat(schedule.fare) * seats.length;

    // Generate ticket number
    const ticketNumber = `SY${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Find or create customer
    let customerId = req.body.customerId;
    
    if (!customerId && customerEmail) {
      // Try to find existing user by email
      let customer = await User.findOne({ 
        where: { email: customerEmail, role: 'customer' }
      });
      
      if (!customer && customerName && customerEmail) {
        // Create a new customer if not exists
        customer = await User.create({
          name: customerName,
          email: customerEmail,
          phoneNumber: customerPhone,
          role: 'customer',
          status: 'active',
          password: Math.random().toString(36).substring(2, 10) // Random password
        });
      }
      
      if (customer) {
        customerId = customer.id;
      }
    }

    // Create booking
    const booking = await Booking.create({
      ticketNumber,
      customerId: customerId || req.user.id, // Fallback to provider if no customer
      scheduleId,
      seats,
      passengerDetails,
      totalAmount,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
      paymentMethod: paymentMethod || 'cash',
      paymentReference: paymentMethod !== 'cash' ? `MANUAL-${Date.now()}` : null,
      bookingStatus: 'confirmed',
      boardingPoint: boardingPoint || schedule.route.source,
      droppingPoint: droppingPoint || schedule.route.destination,
      createdByRole: 'provider',
      createdByUserId: req.user.id,
      // Store customer info denormalized
      customerEmail: customerEmail || null,
      customerName: customerName || null,
      customerPhone: customerPhone || null
    });

    // Update available seats
    await schedule.update({ 
      availableSeats: schedule.availableSeats - seats.length 
    });

    // Get complete booking with associations
    const completeBooking = await Booking.findByPk(booking.id, {
      include: [
        { 
          model: Schedule, 
          as: 'schedule',
          include: [
            { model: Bus, as: 'bus' },
            { model: Route, as: 'route' }
          ]
        },
        { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phoneNumber'] }
      ]
    });

    res.status(201).json({
      message: 'Booking created successfully!',
      booking: completeBooking
    });
  } catch (err) {
    console.error('Create manual booking error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ============ DOCUMENT UPLOAD ============

exports.getDocuments = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['documents'] });
    res.json({ documents: user.documents || [] });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const user = await User.findByPk(req.user.id);
    const docs = Array.isArray(user.documents) ? [...user.documents] : [];
    docs.push({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
    });
    await user.update({ documents: docs });
    res.json({ message: 'Document uploaded successfully', documents: docs });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const user = await User.findByPk(req.user.id);
    const docs = (Array.isArray(user.documents) ? user.documents : []).filter(d => d.filename !== filename);
    await user.update({ documents: docs });

    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../uploads/documents', filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'Document removed', documents: docs });
  } catch (err) { res.status(500).json({ message: err.message }); }
};