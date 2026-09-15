import {
  areaAverageResample,
  calculateImageMetrics,
  countUsedColours,
  createDeterministicPalette,
  quantiseToPalette,
  type RGB,
} from './imageMath';
import {
  makeSound,
  processSound,
  SOURCE_RATE,
  type ProcessedSound,
} from './soundMath';

export const qualityModes = [
  'sample-resolution',
  'sample-rate',
  'image-resolution',
  'colour-depth',
] as const;
export type QualityMode = (typeof qualityModes)[number];
export const qualityLabels: Record<QualityMode, string> = {
  'sample-resolution': 'Sample resolution',
  'sample-rate': 'Sample rate',
  'image-resolution': 'Image resolution',
  'colour-depth': 'Colour depth',
};
export const rateSteps = [8000, 12000, 16000, 24000, 32000, 48000];
export const imageSteps = [8, 16, 32, 48, 64];
export const number = (value: number) =>
  value.toLocaleString('en-GB', { maximumFractionDigits: 2 });

export function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${number(bytes)} bytes`;
  if (bytes < 1e6) return `${number(bytes / 1000)} kB`;
  if (bytes < 1e9) return `${number(bytes / 1e6)} MB`;
  return `${number(bytes / 1e9)} GB`;
}

export function formatSeconds(seconds: number): string {
  if (seconds === 0) return '0 s';
  if (seconds < 0.001) return `${number(seconds * 1e6)} µs`;
  if (seconds < 1) return `${number(seconds * 1000)} ms`;
  return `${number(seconds)} s`;
}

export function formatBitrate(bps: number): string {
  if (bps < 1000) return `${number(bps)} bps`;
  if (bps < 1e6) return `${number(bps / 1000)} kbps`;
  return `${number(bps / 1e6)} Mbps`;
}

const soundSources = new Map<string, Float32Array>();
const soundCache = new Map<string, ProcessedSound>();
export function qualitySound(mode: QualityMode, value: number) {
  const preset = mode === 'sample-rate' ? 'bright' : 'fade';
  let source = soundSources.get(preset);
  if (!source) {
    source = makeSound(preset, 3);
    soundSources.set(preset, source);
  }
  const rate = mode === 'sample-rate' ? value : SOURCE_RATE;
  const bits = mode === 'sample-resolution' ? value : 16;
  const key = `${preset}:${rate}:${bits}`;
  let processed = soundCache.get(key);
  if (!processed) {
    processed = processSound(source, SOURCE_RATE, rate, bits);
    soundCache.set(key, processed);
  }
  return { source, processed };
}

// Canonical samples and palettes never depend on the output resolution.
const imageCache = new WeakMap<
  ImageData,
  { samples: RGB[]; palettes: Map<number, RGB[]> }
>();
export function qualityImage(source: ImageData, width: number, bits: number) {
  let cached = imageCache.get(source);
  if (!cached) {
    cached = {
      samples: areaAverageResample(source, 50, 50),
      palettes: new Map(),
    };
    imageCache.set(source, cached);
  }
  let palette = cached.palettes.get(bits);
  if (!palette) {
    palette = createDeterministicPalette(cached.samples, 2 ** bits);
    cached.palettes.set(bits, palette);
  }
  const indices = quantiseToPalette(
    areaAverageResample(source, width, width),
    palette,
  );
  return {
    width,
    palette,
    indices,
    used: countUsedColours(indices),
    ...calculateImageMetrics(width, width, bits),
  };
}
export type QualityImage = ReturnType<typeof qualityImage>;

export interface FilePair {
  beforeBytes: number;
  afterBytes: number;
  source: QualityMode | 'example';
}
export const examplePair: FilePair = {
  beforeBytes: 2e6,
  afterBytes: 8e6,
  source: 'example',
};
export function readFilePair(params: URLSearchParams): FilePair {
  const beforeBytes = Number(params.get('beforeBytes'));
  const afterBytes = Number(params.get('afterBytes'));
  const source = params.get('source');
  // Bound arithmetic and display work; all four quality experiments fit comfortably.
  const valid = [beforeBytes, afterBytes].every(
    (value) => Number.isSafeInteger(value) && value > 0 && value <= 1e9,
  );
  if (!valid || !qualityModes.some((mode) => mode === source))
    return examplePair;
  return { beforeBytes, afterBytes, source: source as QualityMode };
}
