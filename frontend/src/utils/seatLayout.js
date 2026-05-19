export const CATEGORY_META = {
  standard: { label: 'Standard', icon: '🚌', color: 'bg-blue-100 text-blue-700' },
  sofa:     { label: 'Sofa',     icon: '🛋️', color: 'bg-purple-100 text-purple-700' },
  micro:    { label: 'Micro',    icon: '🚐', color: 'bg-green-100 text-green-700' },
};

export const BUS_CATEGORIES = {
  standard: {
    label: 'Standard Bus',
    description: '2-2 layout · regular highway bus',
    layoutType: '2-2',
    leftCols: 2,
    rightCols: 2,
    defaultRows: 10,
  },
  sofa: {
    label: 'Sofa Bus',
    description: '2-1 layout · recliner/tourist bus',
    layoutType: '2-1',
    leftCols: 2,
    rightCols: 1,
    defaultRows: 9,
  },
  micro: {
    label: 'Micro Bus',
    description: '2-1 layout · small capacity',
    layoutType: '2-1',
    leftCols: 2,
    rightCols: 1,
    defaultRows: 5,
  },
  others: {
    label: 'Others',
    description: '1-1 layout · Tata Sumo, Hiace…',
    layoutType: '1-1',
    leftCols: 1,
    rightCols: 1,
    defaultRows: 4,
  },
};

/**
 * Generate a structured seat layout from a flexible config.
 * @param {object} cfg
 * @param {string} cfg.busCategory  - 'standard' | 'sofa' | 'micro' | custom
 * @param {number} cfg.leftCols     - seats on left side per row (1-3)
 * @param {number} cfg.rightCols    - seats on right side per row (1-3)
 * @param {number} cfg.regularRows  - number of standard rows
 * @param {number} cfg.backRowSeats - extra seats in the back row (0 = none)
 */
export function generateSeatLayout({ busCategory = 'standard', leftCols = 2, rightCols = 2, regularRows = 10, backRowSeats = 0 }) {
  const seats = [];
  let num = 1;

  for (let row = 1; row <= regularRows; row++) {
    for (let col = 0; col < leftCols; col++) {
      seats.push({ number: num++, row, position: 'left', col, label: `${row}${String.fromCharCode(65 + col)}` });
    }
    for (let col = 0; col < rightCols; col++) {
      seats.push({ number: num++, row, position: 'right', col, label: `${row}${String.fromCharCode(65 + leftCols + col)}` });
    }
  }

  if (backRowSeats > 0) {
    const backRow = regularRows + 1;
    for (let col = 0; col < backRowSeats; col++) {
      seats.push({ number: num++, row: backRow, position: 'back', col, label: `B${col + 1}` });
    }
  }

  const totalSeats = (leftCols + rightCols) * regularRows + backRowSeats;

  return {
    busCategory,
    layoutType: `${leftCols}-${rightCols}`,
    leftCols,
    rightCols,
    regularRows,
    backRowSeats,
    rows: regularRows + (backRowSeats > 0 ? 1 : 0),
    totalSeats,
    seats,
  };
}
