import { describe, expect, it, vi } from 'vitest';
import {
  SOURCE_CROP,
  areaAverageResample,
  binaryCode,
  calculateImageMetrics,
  createDeterministicPalette,
  extractCanonicalCrop,
  maximumColours,
  nearestPaletteIndex,
  quantiseToPalette,
  rgbToHex,
  type RGB,
} from '@/src/lib/imageMath';

function imageData(width: number, height: number, pixels: number[]): ImageData {
  return {
    width,
    height,
    data: Uint8ClampedArray.from(pixels),
    colorSpace: 'srgb',
  } as ImageData;
}

describe('image metrics', () => {
  it('calculates the default teaching example with binary units', () => {
    expect(calculateImageMetrics(32, 32, 4)).toEqual({
      totalPixels: 1024,
      maximumColours: 16,
      rawBits: 4096,
      rawBytes: 512,
      rawKiB: 0.5,
    });
  });

  it('rounds a partial byte up for storage and uses 1024 bytes per KiB', () => {
    expect(calculateImageMetrics(1, 1, 1)).toMatchObject({
      rawBits: 1,
      rawBytes: 1,
      rawKiB: 1 / 1024,
    });
  });

  it.each([
    [1, 2],
    [4, 16],
    [8, 256],
    [24, 16_777_216],
  ])('maps %i bits to %i possible colours', (bits, colours) => {
    expect(maximumColours(bits)).toBe(colours);
  });

  it('pads binary palette codes to the active colour depth', () => {
    expect(binaryCode(0, 4)).toBe('0000');
    expect(binaryCode(5, 4)).toBe('0101');
    expect(binaryCode(255, 8)).toBe('11111111');
  });
});

describe('area-average sampling', () => {
  it('preserves pixels when sampling at the source dimensions', () => {
    const source = imageData(2, 1, [255, 0, 0, 255, 0, 0, 255, 255]);
    expect(areaAverageResample(source, 2, 1)).toEqual([
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 0, b: 255 },
    ]);
  });

  it('uses fractional source-cell weights', () => {
    const source = imageData(2, 1, [255, 0, 0, 255, 0, 0, 255, 255]);
    expect(areaAverageResample(source, 1, 1)).toEqual([
      { r: 128, g: 0, b: 128 },
    ]);
  });

  it('composites transparency onto the fixed #EAEAEA background', () => {
    const source = imageData(1, 1, [10, 20, 30, 0]);
    expect(areaAverageResample(source, 1, 1)).toEqual([
      { r: 234, g: 234, b: 234 },
    ]);
  });
});

describe('deterministic colour quantisation', () => {
  const samples: RGB[] = Array.from({ length: 320 }, (_, index) => ({
    r: index % 256,
    g: Math.floor(index / 2) % 256,
    b: Math.floor(index / 3) % 256,
  }));

  it('produces the requested number of distinct palette colours', () => {
    for (let bits = 1; bits <= 8; bits += 1) {
      const palette = createDeterministicPalette(samples, maximumColours(bits));
      expect(palette).toHaveLength(maximumColours(bits));
      expect(new Set(palette.map(rgbToHex))).toHaveProperty(
        'size',
        maximumColours(bits),
      );
    }
  });

  it('is repeatable and independent of sample iteration order', () => {
    const forward = createDeterministicPalette(samples, 16);
    const reversed = createDeterministicPalette([...samples].reverse(), 16);
    expect(reversed).toEqual(forward);
  });

  it('returns only the distinct colours that are feasible', () => {
    expect(
      createDeterministicPalette(Array(20).fill({ r: 12, g: 34, b: 56 }), 8),
    ).toEqual([{ r: 12, g: 34, b: 56 }]);
  });

  it('uses OKLab nearest-colour matching and resolves ties to the lower index', () => {
    const palette = [
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 },
    ];
    expect(nearestPaletteIndex({ r: 2, g: 2, b: 2 }, palette)).toBe(0);
    expect(nearestPaletteIndex({ r: 250, g: 250, b: 250 }, palette)).toBe(1);
    expect(
      nearestPaletteIndex({ r: 10, g: 10, b: 10 }, [palette[0], palette[0]]),
    ).toBe(0);
    expect([...quantiseToPalette([palette[0], palette[1]], palette)]).toEqual([
      0, 1,
    ]);
  });
});

describe('canonical crop', () => {
  it('stays inside the supplied 429 × 430 source image', () => {
    expect(SOURCE_CROP).toEqual({ x: 13, y: 13, width: 400, height: 400 });
    expect(SOURCE_CROP.x + SOURCE_CROP.width).toBeLessThanOrEqual(429);
    expect(SOURCE_CROP.y + SOURCE_CROP.height).toBeLessThanOrEqual(430);
  });

  it('draws exactly the canonical crop after filling the fixed background', () => {
    const drawImage = vi.fn();
    const fillRect = vi.fn();
    const result = imageData(
      400,
      400,
      Array.from({ length: 400 * 400 * 4 }, () => 0),
    );
    const context = {
      fillStyle: '',
      fillRect,
      drawImage,
      getImageData: vi.fn(() => result),
    } as unknown as CanvasRenderingContext2D;
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue(context);
    const createElement = vi
      .spyOn(document, 'createElement')
      .mockReturnValueOnce(canvas);
    const image = { width: 429, height: 430 } as HTMLImageElement;

    expect(extractCanonicalCrop(image)).toBe(result);
    expect(fillRect).toHaveBeenCalledWith(0, 0, 400, 400);
    expect(drawImage).toHaveBeenCalledWith(
      image,
      13,
      13,
      400,
      400,
      0,
      0,
      400,
      400,
    );
    createElement.mockRestore();
  });
});
