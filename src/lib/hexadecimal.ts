export const hexAlphabet = '0123456789ABCDEF';

export function hexToBinary(hex: string): string {
  if (!/^[0-9a-f]+$/i.test(hex))
    throw new RangeError('Use hexadecimal digits 0–9 and A–F.');
  return hex
    .split('')
    .map((digit) => parseInt(digit, 16).toString(2).padStart(4, '0'))
    .join('');
}

export function rgbHex(channels: readonly number[]): string {
  if (
    channels.length !== 3 ||
    channels.some((v) => !Number.isInteger(v) || v < 0 || v > 255)
  )
    throw new RangeError('Use three integer RGB channels from 0 to 255.');
  return channels
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/** Expanded documentation addresses only; compress the first longest run of 2+ zero groups. */
export function compressIPv6(address: string): string {
  const groups = address.split(':');
  if (groups.length !== 8 || groups.some((g) => !/^[\da-f]{1,4}$/i.test(g)))
    throw new RangeError('Expected eight hexadecimal groups.');
  const short = groups.map((g) => parseInt(g, 16).toString(16));
  let start = -1,
    longest = 1;
  for (let i = 0; i < short.length;) {
    if (short[i] !== '0') {
      i++;
      continue;
    }
    let end = i;
    while (short[end] === '0') end++;
    if (end - i > longest) {
      start = i;
      longest = end - i;
    }
    i = end;
  }
  return start < 0
    ? short.join(':')
    : `${short.slice(0, start).join(':')}::${short.slice(start + longest).join(':')}`;
}

export function screenCapacity(slots: number, bitsPerValue = 16) {
  if (
    !Number.isInteger(slots) ||
    slots < 1 ||
    !Number.isInteger(bitsPerValue) ||
    bitsPerValue < 4 ||
    bitsPerValue % 4 !== 0
  )
    throw new RangeError(
      'Use positive slots and a bit width divisible by four.',
    );
  return {
    binary: Math.floor(slots / bitsPerValue),
    hex: Math.floor(slots / (bitsPerValue / 4)),
  };
}

export function divisionByTwo(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 255)
    throw new RangeError('Use a value from 0 to 255.');
  const rows: { value: number; quotient: number; remainder: number }[] = [];
  do {
    const quotient = Math.floor(value / 2);
    rows.push({ value, quotient, remainder: value % 2 });
    value = quotient;
  } while (value > 0);
  return rows;
}
