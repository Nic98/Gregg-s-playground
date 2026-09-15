export type MemorySystem = 'iec' | 'denary';

export const memoryUnits = {
  iec: [
    { symbol: 'b', name: 'bit' },
    { symbol: 'B', name: 'byte' },
    { symbol: 'KiB', name: 'kibibyte' },
    { symbol: 'MiB', name: 'mebibyte' },
    { symbol: 'GiB', name: 'gibibyte' },
    { symbol: 'TiB', name: 'tebibyte' },
    { symbol: 'PiB', name: 'pebibyte' },
    { symbol: 'EiB', name: 'exbibyte' },
  ],
  denary: [
    { symbol: 'b', name: 'bit' },
    { symbol: 'B', name: 'byte' },
    { symbol: 'kB', name: 'kilobyte' },
    { symbol: 'MB', name: 'megabyte' },
    { symbol: 'GB', name: 'gigabyte' },
    { symbol: 'TB', name: 'terabyte' },
    { symbol: 'PB', name: 'petabyte' },
    { symbol: 'EB', name: 'exabyte' },
  ],
} as const;

// Bits are the canonical quantity. BigInt keeps even 1,024 EiB exact.
export function bitsPerUnit(system: MemorySystem, index: number): bigint {
  if (!Number.isInteger(index) || index < 0 || index > 7)
    throw new RangeError('Unknown memory unit');
  if (index === 0) return 1n;
  return 8n * (system === 'iec' ? 1024n : 1000n) ** BigInt(index - 1);
}

export const groupInteger = (value: bigint) => value.toLocaleString('en-GB');

/** Round ratios without first coercing their numerator to a floating-point number. */
export function displayRatio(
  numerator: bigint,
  denominator: bigint,
  places = 6,
): { text: string; sign: '=' | '≈' | '<' } {
  const scale = 10n ** BigInt(places);
  const scaled = numerator * scale;
  const remainder = scaled % denominator;
  const rounded =
    scaled / denominator + (remainder * 2n >= denominator ? 1n : 0n);
  if (numerator > 0n && rounded === 0n)
    return { text: `0.${'0'.repeat(places - 1)}1`, sign: '<' };
  const integer = groupInteger(rounded / scale);
  const fraction = (rounded % scale)
    .toString()
    .padStart(places, '0')
    .replace(/0+$/, '');
  return {
    text: fraction ? `${integer}.${fraction}` : integer,
    sign: remainder === 0n ? '=' : '≈',
  };
}

export function stepFactor(system: MemorySystem, index: number): number {
  if (index === 0) return 1;
  return index === 1 ? 8 : system === 'iec' ? 1024 : 1000;
}
