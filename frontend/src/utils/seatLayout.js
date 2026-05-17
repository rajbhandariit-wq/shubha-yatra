export const BUS_CATEGORIES = {
  standard: {
    label: 'Standard Bus',
    description: '2-2 layout · regular highway bus',
    layoutType: '2-2',
    leftCols: 2,
    rightCols: 2,
    defaultSeats: 40,
    minSeats: 20,
    maxSeats: 60,
  },
  sofa: {
    label: 'Sofa Bus',
    description: '2-1 layout · recliner/tourist bus',
    layoutType: '2-1',
    leftCols: 2,
    rightCols: 1,
    defaultSeats: 28,
    minSeats: 12,
    maxSeats: 45,
  },
  micro: {
    label: 'Micro Bus',
    description: '2-1 layout · small capacity',
    layoutType: '2-1',
    leftCols: 2,
    rightCols: 1,
    defaultSeats: 14,
    minSeats: 8,
    maxSeats: 22,
  },
};

// Generate a structured seat layout from a bus category + total seat count.
// Returns the object to store in Bus.seatLayout.
export function generateSeatLayout(busCategory, totalSeats) {
  const cfg = BUS_CATEGORIES[busCategory] || BUS_CATEGORIES.standard;
  const seats = [];
  let num = 1;
  let row = 1;

  while (num <= totalSeats) {
    for (let col = 0; col < cfg.leftCols && num <= totalSeats; col++) {
      seats.push({
        number: num++,
        row,
        position: 'left',
        col,
        label: `${row}${String.fromCharCode(65 + col)}`,
      });
    }
    for (let col = 0; col < cfg.rightCols && num <= totalSeats; col++) {
      seats.push({
        number: num++,
        row,
        position: 'right',
        col,
        label: `${row}${String.fromCharCode(65 + cfg.leftCols + col)}`,
      });
    }
    row++;
  }

  return {
    busCategory,
    layoutType: cfg.layoutType,
    leftCols: cfg.leftCols,
    rightCols: cfg.rightCols,
    rows: row - 1,
    seats,
  };
}
