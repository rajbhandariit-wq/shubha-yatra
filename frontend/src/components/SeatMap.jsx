import { useState } from 'react';
import { Users, CircleDot } from 'lucide-react';

export default function SeatMap({ seats = [], selectedSeats = [], onSeatSelect, maxSeats = 5 }) {
  const totalSeats = seats.length;
  const seatsPerRow = 4;
  const rows = Math.ceil(totalSeats / seatsPerRow);

  const getSeatClass = (seat) => {
    if (seat.status === 'booked') return 'seat-booked';
    if (selectedSeats.includes(seat.number)) return 'seat-selected';
    if (seat.type === 'premium') return 'seat-premium';
    return 'seat-available';
  };

  const handleSeatClick = (seat) => {
    if (seat.status === 'booked') return;
    if (selectedSeats.includes(seat.number)) {
      onSeatSelect(selectedSeats.filter(s => s !== seat.number));
    } else {
      if (selectedSeats.length >= maxSeats) return;
      onSeatSelect([...selectedSeats, seat.number]);
    }
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      {/* Bus front */}
      <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-nepal-blue to-blue-600 rounded-xl p-3 text-white">
        <div className="flex items-center gap-2 text-sm"><CircleDot className="h-5 w-5" /> Driver</div>
        <div className="text-sm font-medium">🚌 Front of Bus</div>
        <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" /> {seats.filter(s=>s.status==='available').length} Available</div>
      </div>

      {/* Seat grid */}
      <div className="space-y-2">
        {Array.from({ length: rows }, (_, rowIdx) => {
          const rowSeats = seats.slice(rowIdx * seatsPerRow, (rowIdx + 1) * seatsPerRow);
          return (
            <div key={rowIdx} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-5 text-center">{rowIdx + 1}</span>
              <div className="flex gap-1.5 flex-1">
                {/* Left pair */}
                {rowSeats.slice(0, 2).map(seat => (
                  <button key={seat.number} onClick={() => handleSeatClick(seat)} className={`${getSeatClass(seat)} w-10 h-10 text-xs font-semibold flex items-center justify-center select-none`} title={`Seat ${seat.number}${seat.type === 'premium' ? ' (Premium)' : ''}`} disabled={seat.status === 'booked'}>
                    {seat.number}
                  </button>
                ))}
              </div>
              {/* Aisle */}
              <div className="w-6 text-center text-gray-300 text-xs">|</div>
              <div className="flex gap-1.5 flex-1">
                {/* Right pair */}
                {rowSeats.slice(2, 4).map(seat => (
                  <button key={seat.number} onClick={() => handleSeatClick(seat)} className={`${getSeatClass(seat)} w-10 h-10 text-xs font-semibold flex items-center justify-center select-none`} title={`Seat ${seat.number}${seat.type === 'premium' ? ' (Premium)' : ''}`} disabled={seat.status === 'booked'}>
                    {seat.number}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs">
        <div className="flex items-center gap-1.5"><div className="w-7 h-7 rounded bg-white border-2 border-green-400" /> Available</div>
        <div className="flex items-center gap-1.5"><div className="w-7 h-7 rounded bg-primary-500" /> Selected</div>
        <div className="flex items-center gap-1.5"><div className="w-7 h-7 rounded bg-gray-200 border-2 border-gray-300" /> Booked</div>
        <div className="flex items-center gap-1.5"><div className="w-7 h-7 rounded bg-amber-50 border-2 border-amber-400" /> Premium</div>
      </div>

      {/* Selected summary */}
      {selectedSeats.length > 0 && (
        <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 text-sm text-primary-700 font-medium text-center">
          Selected: Seat(s) {selectedSeats.sort((a,b)=>a-b).join(', ')} ({selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''})
        </div>
      )}
    </div>
  );
}
