import { describe, expect, it } from 'vitest';
import { decodeImageJourney, makeImageJourney } from '../src/lib/imageJourney';

describe('image encoding journey', () => {
  it('uses one code per pixel and a predictable left-to-right, top-to-bottom order', () => {
    const image = makeImageJourney(4, 4, 2);
    expect(image.pixels).toHaveLength(16);
    expect(image.pixels[4]).toMatchObject({ index: 4, x: 0, y: 1, code: '01' });
    expect(image.sequence).toBe('00011011011011001011000111000110');
    expect(image.totalBits).toBe(32);
    expect(image.packedBytes).toBe(4);
  });
  it.each([1, 2, 3])(
    'assigns unique %i-bit codes to colours, not individual pixels',
    (bits) => {
      const image = makeImageJourney(4, 4, bits);
      expect(image.palette).toHaveLength(2 ** bits);
      expect(new Set(image.palette.map((c) => c.code)).size).toBe(2 ** bits);
      for (const pixel of image.pixels) {
        expect(pixel.code).toHaveLength(bits);
        expect(pixel.code).toBe(image.palette[pixel.colourIndex].code);
      }
      expect(image.pixels[1].code).toBe(image.pixels[4].code);
      expect(image.totalBits).toBe(16 * bits);
    },
  );
  it('counts non-square grids and preserves all pixel indices through decoding', () => {
    for (const width of [2, 4, 6, 8])
      for (const height of [2, 4, 6, 8])
        for (const bits of [1, 2, 3]) {
          const image = makeImageJourney(width, height, bits);
          expect(image.pixels).toHaveLength(width * height);
          expect(
            decodeImageJourney(image.sequence, width, height, bits),
          ).toEqual(image.pixels.map((p) => p.colourIndex));
          expect(image.pixels.at(-1)).toMatchObject({
            x: width - 1,
            y: height - 1,
          });
        }
  });
  it('distinguishes raw bits, byte packing and maximum vs used colours', () => {
    const image = makeImageJourney(2, 2, 1);
    expect(image.totalBits).toBe(4);
    expect(image.packedBytes).toBe(1);
    expect(makeImageJourney(4, 4, 3).usedColours).toBe(7);
    expect(makeImageJourney(4, 4, 3).palette).toHaveLength(8);
  });
  it('rejects invalid dimensions, depth and incomplete or non-binary sequences', () => {
    expect(() => makeImageJourney(0, 4, 2)).toThrow();
    expect(() => makeImageJourney(4, 4, 8)).toThrow();
    expect(() => decodeImageJourney('101', 2, 2, 1)).toThrow();
    expect(() => decodeImageJourney('0x01', 2, 2, 1)).toThrow();
  });
});
