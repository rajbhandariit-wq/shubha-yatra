// src/pages/provider/CreateBooking.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Bus, MapPin, CreditCard, Search, UserPlus, X } from 'lucide-react';
import ProviderLayout from '../../components/ProviderLayout';
import { providerAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function CreateBooking() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Search form state
  const [searchParams, setSearchParams] = useState({
    source: '',
    destination: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Available schedules
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  
  // Booking form state
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengers, setPassengers] = useState([{ name: '', age: '', gender: 'male' }]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [boardingPoint, setBoardingPoint] = useState('');
  const [droppingPoint, setDroppingPoint] = useState('');
  
  // Seat layout
  const [seatLayout, setSeatLayout] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);

  // Search for schedules
  const handleSearch = async () => {
    if (!searchParams.source || !searchParams.destination) {
      toast.error('Please select source and destination');
      return;
    }
    
    setSearching(true);
    try {
      const response = await providerAPI.searchSchedules(searchParams);
      setSchedules(response.data.schedules);
      if (response.data.schedules.length === 0) {
        toast.error('No schedules found for this route');
      }
    } catch (error) {
      toast.error('Failed to search schedules');
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  // Fetch seat layout when schedule is selected
  const handleScheduleSelect = async (schedule) => {
    setSelectedSchedule(schedule);
    try {
      const response = await providerAPI.getSeatLayout(schedule.id);
      setSeatLayout(response.data.layout);
      setBookedSeats(response.data.bookedSeats);
      setSelectedSeats([]);
    } catch (error) {
      toast.error('Failed to load seat layout');
      console.error(error);
    }
  };

  // Handle seat selection
  const toggleSeat = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) {
      toast.error('Seat already booked');
      return;
    }
    
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
    } else {
      if (selectedSeats.length >= passengers.length) {
        toast.error(`You can only select ${passengers.length} seats`);
        return;
      }
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  // Add passenger
  const addPassenger = () => {
    if (passengers.length < selectedSeats.length) {
      setPassengers([...passengers, { name: '', age: '', gender: 'male' }]);
    } else {
      toast.error(`You have selected ${selectedSeats.length} seats. Add passengers accordingly`);
    }
  };

  // Remove passenger
  const removePassenger = (index) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index));
    }
  };

  // Update passenger details
  const updatePassenger = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  // Handle booking submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedSeats.length !== passengers.length) {
      toast.error(`Please add details for all ${selectedSeats.length} passengers`);
      return;
    }
    
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }
    
    // Validate passenger details
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].name) {
        toast.error(`Please enter name for passenger ${i + 1}`);
        return;
      }
      if (!passengers[i].age) {
        toast.error(`Please enter age for passenger ${i + 1}`);
        return;
      }
    }
    
    setLoading(true);
    try {
      const bookingData = {
        scheduleId: selectedSchedule.id,
        seats: selectedSeats,
        passengerDetails: passengers,
        paymentMethod: paymentMethod,
        boardingPoint: boardingPoint || selectedSchedule.route?.source,
        droppingPoint: droppingPoint || selectedSchedule.route?.destination,
        createdByRole: 'provider'
      };
      
      const response = await providerAPI.createBooking(bookingData);
      toast.success('Booking created successfully!');
      navigate('/provider/bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProviderLayout title="Create Manual Booking">
      <div className="max-w-6xl mx-auto">
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-nepal-blue" />
            Find Schedule
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-nepal-blue focus:border-nepal-blue"
                value={searchParams.source}
                onChange={(e) => setSearchParams({ ...searchParams, source: e.target.value })}
              >
                <option value="">Select Source</option>
                <option value="Kathmandu">Kathmandu</option>
                <option value="Pokhara">Pokhara</option>
                <option value="Chitwan">Chitwan</option>
                <option value="Lumbini">Lumbini</option>
                <option value="Butwal">Butwal</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-nepal-blue focus:border-nepal-blue"
                value={searchParams.destination}
                onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
              >
                <option value="">Select Destination</option>
                <option value="Kathmandu">Kathmandu</option>
                <option value="Pokhara">Pokhara</option>
                <option value="Chitwan">Chitwan</option>
                <option value="Lumbini">Lumbini</option>
                <option value="Butwal">Butwal</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Travel Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-nepal-blue focus:border-nepal-blue"
                value={searchParams.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
              />
            </div>
          </div>
          
          <button
            onClick={handleSearch}
            disabled={searching}
            className="w-full bg-nepal-blue text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search Schedules'}
          </button>
        </div>
        
        {/* Schedules List */}
        {schedules.length > 0 && !selectedSchedule && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Available Schedules</h2>
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleScheduleSelect(schedule)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {schedule.route?.source} → {schedule.route?.destination}
                      </p>
                      <p className="text-sm text-gray-500">
                        Bus: {schedule.bus?.name} • Departure: {schedule.departureTime}
                      </p>
                      <p className="text-sm text-gray-500">
                        Available Seats: {schedule.availableSeats}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-nepal-red">NPR {schedule.fare}</p>
                      <p className="text-xs text-gray-500">per seat</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Seat Selection & Booking Form */}
        {selectedSchedule && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Book Tickets</h2>
              <button
                onClick={() => setSelectedSchedule(null)}
                className="text-sm text-nepal-blue hover:underline"
              >
                Change Schedule
              </button>
            </div>
            
            {/* Schedule Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{selectedSchedule.route?.source} → {selectedSchedule.route?.destination}</p>
                  <p className="text-sm text-gray-600">
                    Date: {selectedSchedule.travelDate} • Time: {selectedSchedule.departureTime}
                  </p>
                  <p className="text-sm text-gray-600">Bus: {selectedSchedule.bus?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-nepal-blue">NPR {selectedSchedule.fare}</p>
                  <p className="text-xs text-gray-500">per seat</p>
                </div>
              </div>
            </div>
            
            {/* Seat Layout (simplified) */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Select Seats</h3>
              <div className="grid grid-cols-4 gap-2 max-w-md">
                {Array.from({ length: selectedSchedule.bus?.totalSeats || 40 }, (_, i) => i + 1).map((seatNum) => {
                  const isBooked = bookedSeats.includes(seatNum);
                  const isSelected = selectedSeats.includes(seatNum);
                  return (
                    <button
                      key={seatNum}
                      onClick={() => toggleSeat(seatNum)}
                      disabled={isBooked}
                      className={`
                        p-2 text-center rounded-lg text-sm font-medium transition-all
                        ${isBooked ? 'bg-gray-300 cursor-not-allowed' : ''}
                        ${isSelected ? 'bg-green-500 text-white' : ''}
                        ${!isBooked && !isSelected ? 'bg-gray-100 hover:bg-nepal-blue hover:text-white' : ''}
                      `}
                    >
                      {seatNum}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected: {selectedSeats.join(', ') || 'None'}
              </p>
            </div>
            
            {/* Passenger Details */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800">Passenger Details</h3>
                <button
                  type="button"
                  onClick={addPassenger}
                  className="text-sm text-nepal-blue flex items-center gap-1"
                >
                  <UserPlus className="h-4 w-4" /> Add Passenger
                </button>
              </div>
              
              <div className="space-y-3">
                {passengers.map((passenger, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">Passenger {index + 1}</span>
                      {passengers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePassenger(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Full Name"
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        value={passenger.name}
                        onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Age"
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        value={passenger.age}
                        onChange={(e) => updatePassenger(index, 'age', e.target.value)}
                      />
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        value={passenger.gender}
                        onChange={(e) => updatePassenger(index, 'gender', e.target.value)}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Booking Form */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Boarding Point</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter boarding point"
                    value={boardingPoint}
                    onChange={(e) => setBoardingPoint(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dropping Point</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter dropping point"
                    value={droppingPoint}
                    onChange={(e) => setDroppingPoint(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-nepal-red">
                    NPR {selectedSeats.length * selectedSchedule.fare}
                  </span>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading || selectedSeats.length === 0}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Booking...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}