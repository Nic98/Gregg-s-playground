import { describe, expect, it } from 'vitest';
import {
  compressIPv6,
  divisionByTwo,
  hexToBinary,
  rgbHex,
  screenCapacity,
} from '../src/lib/hexadecimal';
import {
  allDemos,
  numberDemos,
  numberSectionRoute,
  syllabus,
} from '../src/data/syllabus';

describe('hexadecimal teaching models', () => {
  it('maps all byte values into exactly two four-bit groups', () => {
    for (let n = 0; n < 256; n++) {
      const hex = n.toString(16).padStart(2, '0');
      expect(hexToBinary(hex)).toBe(n.toString(2).padStart(8, '0'));
    }
    expect(hexToBinary('000A')).toBe('0000000000001010');
    expect(hexToBinary('B9F24C80')).toHaveLength(32);
  });
  it.each(['', 'G0', '#FF', '0xAF', 'AF ', '12:34'])(
    'rejects invalid hex %s',
    (value) => {
      expect(() => hexToBinary(value)).toThrow(RangeError);
    },
  );
  it('keeps RGB channel order and leading zeros', () => {
    expect(rgbHex([185, 242, 76])).toBe('B9F24C');
    expect(rgbHex([0, 15, 255])).toBe('000FFF');
    for (const channels of [
      [0, 0],
      [0, 0, 256],
      [-1, 0, 0],
      [1.5, 0, 0],
    ])
      expect(() => rgbHex(channels)).toThrow();
  });
  it.each([
    ['2001:0DB8:0000:0000:0000:0000:0000:00AF', '2001:db8::af'],
    ['2001:0DB8:1234:0000:0000:0000:ABCD:0001', '2001:db8:1234::abcd:1'],
    ['0:0:0:0:0:0:0:0', '::'],
    ['1:0:0:2:0:0:3:4', '1::2:0:0:3:4'],
    ['1:2:3:4:5:6:0:0', '1:2:3:4:5:6::'],
    ['0:0:1:2:3:4:5:6', '::1:2:3:4:5:6'],
    ['1:2:3:4:5:0:7:8', '1:2:3:4:5:0:7:8'],
  ])(
    'compresses %s without changing its group structure',
    (full, compressed) => {
      expect(compressIPv6(full)).toBe(compressed);
    },
  );
  it('rejects invalid expanded IPv6 input', () => {
    for (const value of ['::1', '1:2:3:4:5:6:7:GGGG', '1:2:3:4:5:6:7:12345'])
      expect(() => compressIPv6(value)).toThrow();
  });
  it('compares display capacity, not data compression', () => {
    expect(screenCapacity(32)).toEqual({ binary: 2, hex: 8 });
    expect(screenCapacity(48)).toEqual({ binary: 3, hex: 12 });
    expect(screenCapacity(15)).toEqual({ binary: 0, hex: 3 });
    expect(() => screenCapacity(0)).toThrow();
    expect(() => screenCapacity(32, 5)).toThrow();
  });
  it('reads denary division remainders bottom to top for every byte', () => {
    for (let n = 0; n < 256; n++) {
      const rows = divisionByTwo(n);
      expect(
        rows
          .toReversed()
          .map((r) => r.remainder)
          .join('')
          .padStart(8, '0'),
      ).toBe(n.toString(2).padStart(8, '0'));
      expect(rows.at(-1)?.quotient).toBe(0);
    }
    expect(() => divisionByTwo(256)).toThrow();
  });
  it('registers both labs only under the live number-systems subsection', () => {
    const section = syllabus[0].sections.find((s) => s.id === '1.1');
    expect(section).toMatchObject({
      status: 'live',
      route: numberSectionRoute,
    });
    expect(numberDemos).toHaveLength(2);
    expect(
      numberDemos.every((d) => d.route.startsWith(`${numberSectionRoute}/`)),
    ).toBe(true);
    expect(new Set(allDemos.map((d) => d.route)).size).toBe(allDemos.length);
  });
});
