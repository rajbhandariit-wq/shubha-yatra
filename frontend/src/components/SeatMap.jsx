import { Users, CircleDot } from 'lucide-react';

// Renders a seat button. seat may be null (empty slot in partial last row).
function SeatBtn({ seat, selected, onClick }) {
  if (!seat) return <div className="w-10 h-10" />;
  let cls = 'w-10 h-10 rounded-lg text-xs font-semibold flex items-center justify-center select-none transition-all ';
  if (seat.status === 'booked')        cls += 'bg-gray-200 text-gray-400 border-2 border-gray-300 cursor-not-allowed';
  else if (selected)                   cls += 'bg-primary-500 text-white border-2 border-primary-600 shadow-md scale-105';
  else                                 cls += 'bg-white text-gray-700 border-2 border-green-400 hover:border-nepal-blue hover:bg-blue-50 cursor-pointer';

  return (
    <button
      className={cls}
      onClick={onClick}
      disabled={seat.status === 'booked'}
      title={`Seat ${seat.label ?? seat.number}${seat.status === 'booked' ? ' (Booked)' : ''}`}
    >
      {seat.label ?? seat.number}
    </button>
  );
}

export default function SeatMap({
  seats = [],
  layout = null,
  selectedSeats = [],
  onSeatSelect,
  maxSeats = 5,
  readonly = false,
}) {
  const isNewFormat = seats.length > 0 && seats[0].row != null;

  const leftCols  = layout?.leftCols  ?? 2;
  const rightCols = layout?.rightCols ?? 2;

  const handleClick = (seat) => {
    if (readonly || !onSeatSelect || seat.status === 'booked') return;
    if (selectedSeats.includes(seat.number)) {
      onSeatSelect(selectedSeats.filter(n => n !== seat.number));
    } else {
      if (selectedSeats.length >= maxSeats) return;
      onSeatSelect([...selectedSeats, seat.number]);
    }
  };

  // ── New format: seats carry row / position / col ─────────────────────────
  const renderNewFormat = () => {
    const rowMap = {};
    seats.forEach(seat => {
      if (!rowMap[seat.row]) {
        rowMap[seat.row] = {
          left:  Array(leftCols).fill(null),
          right: Array(rightCols).fill(null),
        };
      }
      rowMap[seat.row][seat.position][seat.col] = seat;
    });

    const rowNums = Object.keys(rowMap).map(Number).sort((a, b) => a - b);

    return rowNums.map(rowNum => {
      const row = rowMap[rowNum];
      return (
        <div key={rowNum} className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-5 text-right shrink-0">{rowNum}</span>
          <div className="flex gap-1.5">
            {row.left.map((seat, i) => (
              <SeatBtn key={i} seat={seat} selected={seat && selectedSeats.includes(seat.number)} onClick={() => seat && handleClick(seat)} />
            ))}
          </div>
          <div className="w-5 text-center text-gray-200 text-lg shrink-0">│</div>
          <div className="flex gap-1.5">
            {row.right.map((seat, i) => (
              <SeatBtn key={i} seat={seat} selected={seat && selectedSeats.includes(seat.number)} onClick={() => seat && handleClick(seat)} />
            ))}
          </div>
        </div>
      );
    });
  };

  // ── Legacy format: flat numbered seats, hardcoded 2-2 layout ─────────────
  const renderLegacyFormat = () => {
    const seatsPerRow = 4;
    const rows = Math.ceil(seats.length / seatsPerRow);
    return Array.from({ length: rows }, (_, rowIdx) => {
      const rowSeats = seats.slice(rowIdx * seatsPerRow, (rowIdx + 1) * seatsPerRow);
      return (
        <div key={rowIdx} className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-5 text-right shrink-0">{rowIdx + 1}</span>
          <div className="flex gap-1.5">
            {rowSeats.slice(0, 2).map(seat => (
              <SeatBtn key={seat.number} seat={seat} selected={selectedSeats.includes(seat.number)} onClick={() => handleClick(seat)} />
            ))}
          </div>
          <div className="w-5 text-center text-gray-200 text-lg shrink-0">│</div>
          <div className="flex gap-1.5">
            {rowSeats.slice(2, 4).map(seat => (
              <SeatBtn key={seat.number} seat={seat} selected={selectedSeats.includes(seat.number)} onClick={() => handleClick(seat)} />
            ))}
          </div>
        </div>
      );
    });
  };

  const availableCount = seats.filter(s => s.status === 'available').length;

  return (
    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      {/* Bus front */}
      <div className="flex items-center justify-between mb-5 bg-gradient-to-r from-nepal-blue to-blue-600 rounded-xl px-4 py-3 text-white">
        <div className="flex items-center gap-2 text-sm"><CircleDot className="h-5 w-5" /> Driver</div>
        <div className="text-sm font-medium">🚌 Front</div>
        <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" /> {availableCount} Available</div>
      </div>

      {/* Column header */}
      {isNewFormat && (
        <div className="flex items-center gap-2 mb-2 ml-7">
          <div className="flex gap-1.5">
            {Array.from({ length: leftCols }, (_, i) => (
              <div key={i} className="w-10 text-center text-xs font-semibold text-gray-400">{String.fromCharCode(65 + i)}</div>
            ))}
          </div>
          <div className="w-5" />
          <div className="flex gap-1.5">
            {Array.from({ length: rightCols }, (_, i) => (
              <div key={i} className="w-10 text-center text-xs font-semibold text-gray-400">{String.fromCharCode(65 + leftCols + i)}</div>
            ))}
          </div>
        </div>
      )}

      {/* Seat grid */}
      <div className="space-y-2 overflow-x-auto">
        {isNewFormat ? renderNewFormat() : renderLegacyFormat()}
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap gap-4 justify-center text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><div className="w-7 h-7 rounded-lg bg-white border-2 border-green-400" /> Available</div>
        <div className="flex items-center gap-1.5"><div className="w-7 h-7 rounded-lg bg-primary-500" /> Selected</div>
        <div className="flex items-center gap-1.5"><div className="w-7 h-7 rounded-lg bg-gray-200 border-2 border-gray-300" /> Booked</div>
      </div>

      {/* Selected summary */}
      {!readonly && selectedSeats.length > 0 && (
        <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 text-sm text-primary-700 font-medium text-center">
          Selected: {selectedSeats.sort((a, b) => a - b).join(', ')} · {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
