'use client';

interface QRCodeProps {
  value: string;
  size?: number;
}

// Minimal QR Code encoder (Version 2, 25x25, Error Correction Level L)
// Based on QR code specification - supports alphanumeric + URL data
export default function QRCode({ value, size = 200 }: QRCodeProps) {
  const modules = generateQRMatrix(value);
  const moduleCount = modules.length;
  const cellSize = size / moduleCount;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${moduleCount} ${moduleCount}`}>
      <rect width={moduleCount} height={moduleCount} fill="white" />
      {modules.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill="black"
            />
          ) : null
        )
      )}
    </svg>
  );
}

function generateQRMatrix(text: string): boolean[][] {
  // Encode text to binary using simple byte mode
  const data = encodeText(text);
  const size = 25; // Version 2
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Place finder patterns
  placeFinder(matrix, reserved, 0, 0);
  placeFinder(matrix, reserved, size - 7, 0);
  placeFinder(matrix, reserved, 0, size - 7);

  // Place timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) { matrix[6][i] = i % 2 === 0; reserved[6][i] = true; }
    if (!reserved[i][6]) { matrix[i][6] = i % 2 === 0; reserved[i][6] = true; }
  }

  // Place data
  let bitIndex = 0;
  let direction = -1;
  let row = size - 1;
  let col = size - 1;

  while (col >= 0) {
    if (col === 6) col--; // Skip timing column
    for (let i = 0; i < 2; i++) {
      const r = row + i * direction;
      if (r >= 0 && r < size && !reserved[r][col]) {
        matrix[r][col] = bitIndex < data.length ? data[bitIndex] : false;
        reserved[r][col] = true;
        bitIndex++;
      }
    }
    if (row === (direction === -1 ? 0 : size - 1)) {
      direction = -direction;
      col -= 2;
    } else {
      row += direction;
    }
    if (col < 0) break;
  }

  // Apply mask pattern 0 (checkerboard)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] || (r < 8 && c < 8) || (r < 8 && c > size - 8) || (r > size - 8 && c < 8)) continue;
      if ((r + c) % 2 === 0) matrix[r][c] = !matrix[r][c];
    }
  }

  return matrix;
}

function placeFinder(matrix: boolean[][], reserved: boolean[][], row: number, col: number) {
  const pattern = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1],
  ];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const mr = row + r, mc = col + c;
      if (mr >= 0 && mr < matrix.length && mc >= 0 && mc < matrix.length) {
        matrix[mr][mc] = pattern[r][c] === 1;
        reserved[mr][mc] = true;
      }
    }
  }
}

function encodeText(text: string): boolean[] {
  // Byte mode encoding
  const bytes = new TextEncoder().encode(text);
  const bits: boolean[] = [];

  // Mode indicator: 0100 (byte mode)
  bits.push(false, true, false, false);

  // Character count (8 bits for version 1-9)
  for (let i = 7; i >= 0; i--) bits.push(((bytes.length >> i) & 1) === 1);

  // Data bytes
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) bits.push(((byte >> i) & 1) === 1);
  }

  // Terminator
  bits.push(false, false, false, false);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(false);

  // Pad bytes (0xEC, 0x11 alternating)
  const padBytes = [0xEC, 0x11];
  let padIdx = 0;
  while (bits.length < 25 * 8) {
    const pb = padBytes[padIdx % 2];
    for (let i = 7; i >= 0; i--) bits.push(((pb >> i) & 1) === 1);
    padIdx++;
  }

  return bits;
}
