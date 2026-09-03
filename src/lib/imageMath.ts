export interface RGB {
  r: number;
  g: number;
  b: number;
}

interface OKLab {
  l: number;
  a: number;
  b: number;
}

interface LabSample extends RGB {
  lab: OKLab;
  key: number;
  weight: number;
}

export interface ImageMetrics {
  totalPixels: number;
  maximumColours: number;
  rawBits: number;
  rawBytes: number;
  rawKiB: number;
}

export const SOURCE_CROP = { x: 13, y: 13, width: 400, height: 400 } as const;
export const DEFAULT_WIDTH = 32;
export const DEFAULT_HEIGHT = 32;
export const DEFAULT_BPP = 4;

export function maximumColours(bitsPerPixel: number): number {
  return 2 ** bitsPerPixel;
}

export function calculateImageMetrics(
  width: number,
  height: number,
  bitsPerPixel: number,
): ImageMetrics {
  const totalPixels = width * height;
  const rawBits = totalPixels * bitsPerPixel;
  const rawBytes = Math.ceil(rawBits / 8);
  return {
    totalPixels,
    maximumColours: maximumColours(bitsPerPixel),
    rawBits,
    rawBytes,
    rawKiB: rawBytes / 1024,
  };
}

export function binaryCode(index: number, bitsPerPixel: number): string {
  return index.toString(2).padStart(bitsPerPixel, '0').slice(-bitsPerPixel);
}

export function rgbToHex(colour: RGB): string {
  return `#${[colour.r, colour.g, colour.b]
    .map((channel) =>
      Math.max(0, Math.min(255, Math.round(channel)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`.toUpperCase();
}

function srgbChannelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function rgbToOKLab(colour: RGB): OKLab {
  const r = srgbChannelToLinear(colour.r);
  const g = srgbChannelToLinear(colour.g);
  const b = srgbChannelToLinear(colour.b);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  return {
    l: 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    a: 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    b: 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  };
}

function labDistanceSquared(left: OKLab, right: OKLab): number {
  return (
    (left.l - right.l) ** 2 + (left.a - right.a) ** 2 + (left.b - right.b) ** 2
  );
}

export function nearestPaletteIndex(colour: RGB, palette: RGB[]): number {
  const lab = rgbToOKLab(colour);
  const paletteLabs = palette.map(rgbToOKLab);
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  paletteLabs.forEach((candidate, index) => {
    const distance = labDistanceSquared(lab, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex;
}

export function areaAverageResample(
  source: ImageData,
  outputWidth: number,
  outputHeight: number,
): RGB[] {
  if (outputWidth < 1 || outputHeight < 1) return [];
  const colours: RGB[] = [];
  const scaleX = source.width / outputWidth;
  const scaleY = source.height / outputHeight;

  for (let outputY = 0; outputY < outputHeight; outputY += 1) {
    const sourceY0 = outputY * scaleY;
    const sourceY1 = (outputY + 1) * scaleY;
    for (let outputX = 0; outputX < outputWidth; outputX += 1) {
      const sourceX0 = outputX * scaleX;
      const sourceX1 = (outputX + 1) * scaleX;
      let r = 0;
      let g = 0;
      let b = 0;
      let totalWeight = 0;

      for (
        let sourceY = Math.floor(sourceY0);
        sourceY < Math.ceil(sourceY1);
        sourceY += 1
      ) {
        const yWeight = Math.max(
          0,
          Math.min(sourceY + 1, sourceY1) - Math.max(sourceY, sourceY0),
        );
        for (
          let sourceX = Math.floor(sourceX0);
          sourceX < Math.ceil(sourceX1);
          sourceX += 1
        ) {
          const xWeight = Math.max(
            0,
            Math.min(sourceX + 1, sourceX1) - Math.max(sourceX, sourceX0),
          );
          const weight = xWeight * yWeight;
          const clampedX = Math.min(source.width - 1, Math.max(0, sourceX));
          const clampedY = Math.min(source.height - 1, Math.max(0, sourceY));
          const offset = (clampedY * source.width + clampedX) * 4;
          const alpha = source.data[offset + 3] / 255;
          const background = 234;
          r +=
            (source.data[offset] * alpha + background * (1 - alpha)) * weight;
          g +=
            (source.data[offset + 1] * alpha + background * (1 - alpha)) *
            weight;
          b +=
            (source.data[offset + 2] * alpha + background * (1 - alpha)) *
            weight;
          totalWeight += weight;
        }
      }

      colours.push({
        r: Math.round(r / totalWeight),
        g: Math.round(g / totalWeight),
        b: Math.round(b / totalWeight),
      });
    }
  }

  return colours;
}

function channelRange(samples: LabSample[], channel: keyof OKLab): number {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (const sample of samples) {
    minimum = Math.min(minimum, sample.lab[channel]);
    maximum = Math.max(maximum, sample.lab[channel]);
  }
  return maximum - minimum;
}

function packedRgb(colour: RGB): number {
  return (colour.r << 16) | (colour.g << 8) | colour.b;
}

function normaliseSamples(samples: RGB[]): LabSample[] {
  const weighted = new Map<number, LabSample>();
  for (const sample of samples) {
    const colour = {
      r: Math.max(0, Math.min(255, Math.round(sample.r))),
      g: Math.max(0, Math.min(255, Math.round(sample.g))),
      b: Math.max(0, Math.min(255, Math.round(sample.b))),
    };
    const key = packedRgb(colour);
    const existing = weighted.get(key);
    if (existing) {
      existing.weight += 1;
    } else {
      weighted.set(key, { ...colour, key, lab: rgbToOKLab(colour), weight: 1 });
    }
  }
  return [...weighted.values()].sort((left, right) => left.key - right.key);
}

function bucketSplitChannel(bucket: LabSample[]): keyof OKLab {
  const ranges: Array<[keyof OKLab, number]> = [
    ['l', channelRange(bucket, 'l')],
    ['a', channelRange(bucket, 'a')],
    ['b', channelRange(bucket, 'b')],
  ];
  ranges.sort((left, right) => right[1] - left[1]);
  return ranges[0][0];
}

function compareLabSamples(channel: keyof OKLab) {
  return (left: LabSample, right: LabSample) =>
    left.lab[channel] - right.lab[channel] ||
    left.lab.l - right.lab.l ||
    left.lab.a - right.lab.a ||
    left.lab.b - right.lab.b ||
    left.key - right.key;
}

function comparePaletteColours(left: RGB, right: RGB): number {
  const leftLab = rgbToOKLab(left);
  const rightLab = rgbToOKLab(right);
  const leftBand = Math.floor(leftLab.l / 0.04);
  const rightBand = Math.floor(rightLab.l / 0.04);
  const leftHue =
    (Math.atan2(leftLab.b, leftLab.a) + Math.PI * 2) % (Math.PI * 2);
  const rightHue =
    (Math.atan2(rightLab.b, rightLab.a) + Math.PI * 2) % (Math.PI * 2);
  return (
    leftBand - rightBand ||
    leftHue - rightHue ||
    leftLab.l - rightLab.l ||
    leftLab.a - rightLab.a ||
    leftLab.b - rightLab.b ||
    packedRgb(left) - packedRgb(right)
  );
}

export function createDeterministicPalette(
  samples: RGB[],
  count: number,
): RGB[] {
  if (samples.length === 0 || count < 1) return [];
  const uniqueSamples = normaliseSamples(samples);
  const targetCount = Math.min(Math.floor(count), uniqueSamples.length);
  const buckets: LabSample[][] = [uniqueSamples];

  while (buckets.length < targetCount) {
    let chosenIndex = -1;
    let chosenScore = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < buckets.length; index += 1) {
      const bucket = buckets[index];
      if (bucket.length < 2) continue;
      const channel = bucketSplitChannel(bucket);
      const totalWeight = bucket.reduce(
        (total, sample) => total + sample.weight,
        0,
      );
      const score = channelRange(bucket, channel) * totalWeight;
      if (score > chosenScore) {
        chosenScore = score;
        chosenIndex = index;
      }
    }
    if (chosenIndex < 0) break;

    const bucket = buckets[chosenIndex];
    const channel = bucketSplitChannel(bucket);
    const sorted = [...bucket].sort(compareLabSamples(channel));
    const totalWeight = sorted.reduce(
      (total, sample) => total + sample.weight,
      0,
    );
    let runningWeight = 0;
    let splitIndex = 1;
    for (let index = 0; index < sorted.length - 1; index += 1) {
      runningWeight += sorted[index].weight;
      splitIndex = index + 1;
      if (runningWeight >= totalWeight / 2) break;
    }
    buckets.splice(
      chosenIndex,
      1,
      sorted.slice(0, splitIndex),
      sorted.slice(splitIndex),
    );
  }

  const centroids = buckets.map((bucket) => {
    const totals = bucket.reduce(
      (accumulator, sample) => ({
        r: accumulator.r + sample.r * sample.weight,
        g: accumulator.g + sample.g * sample.weight,
        b: accumulator.b + sample.b * sample.weight,
        weight: accumulator.weight + sample.weight,
      }),
      { r: 0, g: 0, b: 0, weight: 0 },
    );
    return {
      r: Math.round(totals.r / totals.weight),
      g: Math.round(totals.g / totals.weight),
      b: Math.round(totals.b / totals.weight),
    };
  });

  const uniquePalette = new Map<number, RGB>();
  for (const colour of centroids) uniquePalette.set(packedRgb(colour), colour);
  if (uniquePalette.size < targetCount) {
    const sourceColours = uniqueSamples
      .map(({ r, g, b }) => ({ r, g, b }))
      .sort(comparePaletteColours);
    for (const colour of sourceColours) {
      const key = packedRgb(colour);
      if (!uniquePalette.has(key)) uniquePalette.set(key, colour);
      if (uniquePalette.size === targetCount) break;
    }
  }

  return [...uniquePalette.values()]
    .slice(0, targetCount)
    .sort(comparePaletteColours);
}

export function quantiseToPalette(samples: RGB[], palette: RGB[]): Uint8Array {
  const paletteLabs = palette.map(rgbToOKLab);
  return Uint8Array.from(
    samples.map((sample) => {
      const lab = rgbToOKLab(sample);
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let index = 0; index < paletteLabs.length; index += 1) {
        const distance = labDistanceSquared(lab, paletteLabs[index]);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      }
      return bestIndex;
    }),
  );
}

export function countUsedColours(indices: Uint8Array): number {
  return new Set(indices).size;
}

export function extractCanonicalCrop(image: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = SOURCE_CROP.width;
  canvas.height = SOURCE_CROP.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D is not supported in this browser.');
  context.fillStyle = '#EAEAEA';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    SOURCE_CROP.x,
    SOURCE_CROP.y,
    SOURCE_CROP.width,
    SOURCE_CROP.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return context.getImageData(0, 0, canvas.width, canvas.height);
}
