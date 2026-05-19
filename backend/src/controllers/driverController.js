const { Schedule, Bus, Route, User, Booking } = require('../models');
const { Op } = require('sequelize');

// GET /api/driver/schedules — today's claimable + own schedules
exports.getTodaySchedules = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const schedules = await Schedule.findAll({
      where: {
        travelDate: today,
        status: { [Op.notIn]: ['cancelled'] },
        journeyStatus: { [Op.notIn]: ['completed'] },
      },
      include: [
        { model: Bus,   as: 'bus',    attributes: ['id', 'name', 'registrationNumber', 'type'], where: { isActive: true }, required: true },
        { model: Route, as: 'route',  attributes: ['id', 'source', 'destination'], where: { isActive: true }, required: true },
        { model: User,  as: 'driver', attributes: ['id', 'name', 'phoneNumber'], required: false },
      ],
      order: [['departureTime', 'ASC']],
    });
    res.json(schedules);
  } catch (err) {
    console.error('getTodaySchedules error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/driver/schedules/:id/claim — claim an unclaimed schedule
exports.claimSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    if (schedule.journeyStatus === 'completed') return res.status(400).json({ message: 'Journey already completed' });
    if (schedule.currentDriverId && schedule.currentDriverId !== req.user.id) {
      return res.status(409).json({ message: 'Schedule already claimed by another driver' });
    }
    await schedule.update({ currentDriverId: req.user.id });
    res.json({ message: 'Schedule claimed', scheduleId: schedule.id });
  } catch (err) {
    console.error('claimSchedule error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/driver/schedules/:id/takeover — forcibly take over from another driver
exports.takeoverSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    if (schedule.journeyStatus === 'completed') return res.status(400).json({ message: 'Journey already completed' });
    await schedule.update({ currentDriverId: req.user.id });
    res.json({ message: 'Takeover successful', scheduleId: schedule.id });
  } catch (err) {
    console.error('takeoverSchedule error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/driver/schedules/:id/start — start the journey
exports.startJourney = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    if (schedule.currentDriverId !== req.user.id) return res.status(403).json({ message: 'You are not the assigned driver' });
    if (schedule.journeyStatus === 'in_progress') return res.status(400).json({ message: 'Journey already started' });
    if (schedule.journeyStatus === 'completed') return res.status(400).json({ message: 'Journey already completed' });
    await schedule.update({ journeyStatus: 'in_progress', journeyStartedAt: new Date() });
    res.json({ message: 'Journey started' });
  } catch (err) {
    console.error('startJourney error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/driver/schedules/:id/location — update GPS location
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng, accuracy, speed } = req.body;
    if (!lat || !lng) return res.status(400).json({ message: 'lat and lng required' });

    const schedule = await Schedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    if (schedule.currentDriverId !== req.user.id) return res.status(403).json({ message: 'Not the assigned driver' });
    if (schedule.journeyStatus !== 'in_progress') return res.status(400).json({ message: 'Journey not in progress' });

    await schedule.update({
      driverLocation: { lat, lng, accuracy, speed, updatedAt: new Date().toISOString() },
    });
    res.json({ message: 'Location updated' });
  } catch (err) {
    console.error('updateLocation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/driver/schedules/:id/end — end journey
exports.endJourney = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    if (schedule.currentDriverId !== req.user.id) return res.status(403).json({ message: 'Not the assigned driver' });
    if (schedule.journeyStatus !== 'in_progress') return res.status(400).json({ message: 'Journey not in progress' });
    await schedule.update({ journeyStatus: 'completed', journeyEndedAt: new Date(), driverLocation: null });
    res.json({ message: 'Journey ended' });
  } catch (err) {
    console.error('endJourney error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/driver/my-schedule — active schedule for this driver
exports.getMyActiveSchedule = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const schedule = await Schedule.findOne({
      where: {
        currentDriverId: req.user.id,
        travelDate: today,
        journeyStatus: { [Op.in]: ['not_started', 'in_progress'] },
      },
      include: [
        { model: Bus,   as: 'bus',   attributes: ['id', 'name', 'registrationNumber', 'type'] },
        { model: Route, as: 'route', attributes: ['id', 'source', 'destination'] },
      ],
    });
    res.json(schedule || null);
  } catch (err) {
    console.error('getMyActiveSchedule error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/track/:scheduleId — public live tracking
exports.getPublicTracking = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.scheduleId, {
      attributes: ['id', 'travelDate', 'departureTime', 'arrivalTime', 'status',
                   'journeyStatus', 'driverLocation', 'journeyStartedAt', 'delayMinutes'],
      include: [
        { model: Bus,   as: 'bus',   attributes: ['name', 'registrationNumber', 'type'] },
        { model: Route, as: 'route', attributes: ['source', 'destination'] },
        { model: User,  as: 'driver', attributes: ['name'], required: false },
      ],
    });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(schedule);
  } catch (err) {
    console.error('getPublicTracking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
