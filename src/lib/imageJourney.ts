import { binary } from './textEncoding';

export const imageCodeColours = [
  { name: 'White', hex: '#FFFFFF', ink: '#11140F' },
  { name: 'Black', hex: '#11140F', ink: '#FFFFFF' },
  { name: 'Coral', hex: '#FF7048', ink: '#11140F' },
  { name: 'Blue', hex: '#305AC5', ink: '#FFFFFF' },
  { name: 'Lime', hex: '#B9F24C', ink: '#11140F' },
  { name: 'Purple', hex: '#6942A8', ink: '#FFFFFF' },
  { name: 'Yellow', hex: '#F8CE46', ink: '#11140F' },
  { name: 'Cyan', hex: '#56D9DD', ink: '#11140F' },
];

/** Row-major indexed bitmap: one palette index per pixel, no file header. */
export function makeImageJourney(width: number, height: number, bits: number) {
  if (
    ![width, height].every((n) => Number.isInteger(n) && n >= 2 && n <= 8) ||
    ![1, 2, 3].includes(bits)
  )
    throw new RangeError('Use dimensions 2–8 and a colour depth of 1–3 bits.');
  const palette = imageCodeColours
    .slice(0, 2 ** bits)
    .map((colour, index) => ({ ...colour, index, code: binary(index, bits) }));
  const pixels = Array.from({ length: width * height }, (_, index) => {
    const x = index % width,
      y = Math.floor(index / width);
    // Sample the same simple diagonal colour bands at the requested dimensions.
    const colourIndex =
      (Math.floor((x * 4) / width) + Math.floor((y * 4) / height)) %
      palette.length;
    return { index, x, y, colourIndex, code: palette[colourIndex].code };
  });
  const sequence = pixels.map((pixel) => pixel.code).join('');
  return {
    width,
    height,
    bits,
    palette,
    pixels,
    sequence,
    totalBits: sequence.length,
    packedBytes: Math.ceil(sequence.length / 8),
    usedColours: new Set(pixels.map((p) => p.colourIndex)).size,
  };
}

export function decodeImageJourney(
  sequence: string,
  width: number,
  height: number,
  bits: number,
): number[] {
  if (
    ![width, height].every((n) => Number.isInteger(n) && n > 0) ||
    ![1, 2, 3].includes(bits) ||
    /[^01]/.test(sequence) ||
    sequence.length !== width * height * bits
  )
    throw new RangeError(
      'The sequence must contain exactly width × height × colour depth bits.',
    );
  return Array.from({ length: width * height }, (_, i) =>
    parseInt(sequence.slice(i * bits, (i + 1) * bits), 2),
  );
}
