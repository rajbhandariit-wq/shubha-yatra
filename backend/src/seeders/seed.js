require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize, User, Bus, Route, Schedule, Booking, Staff } = require('../models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  await sequelize.sync({ force: true });
  console.log('🌱 Seeding database...');

  // Create admin
  const admin = await User.create({ name: 'Super Admin', email: 'admin@shubhayatra.com', password: 'admin123', role: 'admin', phone: '9800000001' });

  // Create providers
  const provider1 = await User.create({ name: 'Ram Prasad Sharma', email: 'provider1@shubhayatra.com', password: 'pass123', role: 'provider', phone: '9800000002', companyName: 'Himalayan Express Travels', companyAddress: 'Kalanki, Kathmandu' });
  const provider2 = await User.create({ name: 'Sita Devi Thapa', email: 'provider2@shubhayatra.com', password: 'pass123', role: 'provider', phone: '9800000003', companyName: 'Annapurna Yatayat', companyAddress: 'Lakeside, Pokhara' });

  // Create customers
  const customer1 = await User.create({ name: 'Arjun Karki', email: 'customer1@example.com', password: 'pass123', role: 'customer', phone: '9811111111' });
  const customer2 = await User.create({ name: 'Priya Rai', email: 'customer2@example.com', password: 'pass123', role: 'customer', phone: '9822222222' });

  // Create buses for provider1
  const bus1 = await Bus.create({ providerId: provider1.id, name: 'Himalayan Express 001', registrationNumber: 'BA 1 KHA 1234', type: 'AC', totalSeats: 40, amenities: ['WiFi', 'AC', 'USB Charging', 'Water Bottle'] });
  const bus2 = await Bus.create({ providerId: provider1.id, name: 'Everest Deluxe 002', registrationNumber: 'BA 1 KHA 5678', type: 'Deluxe', totalSeats: 36, amenities: ['AC', 'Reclining Seats', 'Blanket'] });
  const bus3 = await Bus.create({ providerId: provider2.id, name: 'Pokhara Liner 001', registrationNumber: 'GA 1 KHA 9012', type: 'Non-AC', totalSeats: 44, amenities: ['Fan', 'Water'] });
  const bus4 = await Bus.create({ providerId: provider2.id, name: 'Annapurna Sleeper 001', registrationNumber: 'GA 1 KHA 3456', type: 'Sleeper', totalSeats: 30, seatLayout: { rows: 10, seatsPerRow: 3, layout: '1-2', hasUpperDeck: true }, amenities: ['AC', 'Blanket', 'Pillow', 'Sleeper Berth'] });

  // Create routes
  const route1 = await Route.create({ providerId: provider1.id, source: 'Kathmandu', destination: 'Pokhara', distance: 204, estimatedDuration: 420, fare: 800, departureTime: '07:00', arrivalTime: '14:00', stops: ['Mugling', 'Damauli'] });
  const route2 = await Route.create({ providerId: provider1.id, source: 'Kathmandu', destination: 'Chitwan', distance: 166, estimatedDuration: 300, fare: 600, departureTime: '08:00', arrivalTime: '13:00', stops: ['Hetauda'] });
  const route3 = await Route.create({ providerId: provider2.id, source: 'Pokhara', destination: 'Lumbini', distance: 200, estimatedDuration: 360, fare: 700, departureTime: '06:00', arrivalTime: '12:00', stops: ['Butwal'] });
  const route4 = await Route.create({ providerId: provider1.id, source: 'Kathmandu', destination: 'Birgunj', distance: 180, estimatedDuration: 390, fare: 750, departureTime: '06:30', arrivalTime: '13:00', stops: ['Hetauda', 'Pathlaiya'] });
  const route5 = await Route.create({ providerId: provider2.id, source: 'Pokhara', destination: 'Biratnagar', distance: 500, estimatedDuration: 900, fare: 1500, departureTime: '18:00', arrivalTime: '09:00', stops: ['Butwal', 'Chitwan', 'Janakpur'] });

  // Create schedules for today + next 7 days
  const today = new Date();
  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];

    await Schedule.create({ busId: bus1.id, routeId: route1.id, travelDate: dateStr, departureTime: '07:00', arrivalTime: '14:00', fare: 800, availableSeats: 35 });
    await Schedule.create({ busId: bus2.id, routeId: route2.id, travelDate: dateStr, departureTime: '08:00', arrivalTime: '13:00', fare: 600, availableSeats: 30 });
    await Schedule.create({ busId: bus3.id, routeId: route3.id, travelDate: dateStr, departureTime: '06:00', arrivalTime: '12:00', fare: 700, availableSeats: 40 });
    if (d < 5) await Schedule.create({ busId: bus4.id, routeId: route4.id, travelDate: dateStr, departureTime: '06:30', arrivalTime: '13:00', fare: 750, availableSeats: 28 });
  }

  // Get a schedule for sample booking
  const sampleSchedule = await Schedule.findOne({ where: { busId: bus1.id, routeId: route1.id } });
  if (sampleSchedule) {
    await Booking.create({
      ticketNumber: 'SY123ABC', customerId: customer1.id, scheduleId: sampleSchedule.id,
      seats: [5, 6], passengerDetails: [{ name: 'Arjun Karki', age: 28 }, { name: 'Sunita Karki', age: 25 }],
      totalAmount: 1600, paymentStatus: 'paid', paymentMethod: 'card', paymentReference: 'PAY-12345678', bookingStatus: 'confirmed'
    });
    await sampleSchedule.update({ availableSeats: 33 });
  }

  // Create staff
  await Staff.create({ providerId: provider1.id, name: 'Bikram Tamang', phone: '9833333333', role: 'driver', licenseNumber: 'DL-BAG-001', joiningDate: '2020-01-15', salary: 25000 });
  await Staff.create({ providerId: provider1.id, name: 'Gopal Shrestha', phone: '9844444444', role: 'conductor', joiningDate: '2021-03-10', salary: 18000 });
  await Staff.create({ providerId: provider2.id, name: 'Hari Bahadur Gurung', phone: '9855555555', role: 'driver', licenseNumber: 'DL-GAP-002', joiningDate: '2019-06-20', salary: 28000 });

  console.log('✅ Seed complete!');
  console.log('\n📋 Test Credentials:');
  console.log('  Admin:    admin@shubhayatra.com / admin123');
  console.log('  Provider: provider1@shubhayatra.com / pass123 (Himalayan Express)');
  console.log('  Provider: provider2@shubhayatra.com / pass123 (Annapurna Yatayat)');
  console.log('  Customer: customer1@example.com / pass123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
