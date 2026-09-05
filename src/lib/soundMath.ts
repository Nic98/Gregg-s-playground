export const SOURCE_RATE = 48000;
export type SoundPreset = 'tone' | 'bright' | 'drums' | 'fade';
export const soundPresets: {
  id: SoundPreset;
  label: string;
  description: string;
}[] = [
  {
    id: 'tone',
    label: 'Pure tone',
    description: 'A 440 Hz tone: follow one cycle through the ADC.',
  },
  {
    id: 'bright',
    label: 'Bright double tone',
    description: '440 Hz + 6,000 Hz: listen for the high-frequency detail.',
  },
  {
    id: 'drums',
    label: 'Synthetic drum loop',
    description: 'A kick and noisy hi-hat: listen to the crisp edges.',
  },
  {
    id: 'fade',
    label: 'Fading notes',
    description: 'Quiet notes expose quantisation noise and distortion.',
  },
];
export function makeSound(preset: SoundPreset, seconds = 3): Float32Array {
  let seed = 2718;
  return Float32Array.from(
    { length: Math.round(seconds * SOURCE_RATE) },
    (_, i) => {
      const t = i / SOURCE_RATE;
      const sine = Math.sin(2 * Math.PI * 440 * t);
      if (preset === 'tone') return 0.72 * sine;
      if (preset === 'bright')
        return 0.42 * sine + 0.3 * Math.sin(2 * Math.PI * 6000 * t);
      if (preset === 'fade')
        return (
          0.7 *
          Math.exp(-1.5 * t) *
          (sine + 0.25 * Math.sin(2 * Math.PI * 880 * t))
        );
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const beat = t % 0.5;
      const hat = t % 0.25;
      return (
        0.6 *
          Math.sin(
            2 * Math.PI * (65 * beat + 10 * (1 - Math.exp(-25 * beat))),
          ) *
          Math.exp(-18 * beat) +
        0.28 * ((seed / 0xffffffff) * 2 - 1) * Math.exp(-65 * hat)
      );
    },
  );
}
export function quantise(amplitude: number, bits: number) {
  const max = 2 ** bits - 1;
  const code = Math.round(
    (Math.max(-1, Math.min(1, amplitude)) + 1) * 0.5 * max,
  );
  return { code, amplitude: (code / max) * 2 - 1 };
}
// Windowed-sinc low-pass resampling. Each output sample uses the original source.
// A 0.45 × target-rate cutoff leaves a transition band below the new Nyquist limit.
export function resample(
  source: Float32Array,
  sourceRate: number,
  targetRate: number,
): Float32Array {
  if (sourceRate === targetRate) return source.slice();
  const ratio = sourceRate / targetRate;
  const cutoff = 0.45 * Math.min(1, targetRate / sourceRate);
  const radius = Math.ceil(32 * Math.max(1, ratio));
  const output = new Float32Array(Math.floor(source.length / ratio));
  for (let i = 0; i < output.length; i++) {
    const centre = i * ratio;
    let sum = 0,
      weightSum = 0;
    for (
      let k = Math.max(0, Math.ceil(centre - radius));
      k <= Math.min(source.length - 1, Math.floor(centre + radius));
      k++
    ) {
      const d = k - centre;
      const x = 2 * Math.PI * cutoff * d;
      const weight =
        (Math.abs(x) < 1e-9 ? 2 * cutoff : Math.sin(x) / (Math.PI * d)) *
        (0.5 + 0.5 * Math.cos((Math.PI * d) / radius));
      sum += source[k] * weight;
      weightSum += weight;
    }
    output[i] = weightSum ? sum / weightSum : 0;
  }
  return output;
}
export function processSound(
  source: Float32Array,
  sourceRate: number,
  rate: number,
  bits: number,
) {
  const measured = resample(source, sourceRate, rate);
  const codes = new Uint16Array(measured.length);
  const samples = new Float32Array(measured.length);
  for (let i = 0; i < measured.length; i++) {
    const q = quantise(measured[i], bits);
    codes[i] = q.code;
    samples[i] = q.amplitude;
  }
  return {
    measured,
    codes,
    samples,
    rate,
    bits,
    totalBits: samples.length * bits,
    duration: samples.length / rate,
  };
}
export type ProcessedSound = ReturnType<typeof processSound>;
export type ListeningExperiment = 'rate' | 'resolution' | 'equal';
export const listeningExperiments = {
  rate: {
    label: 'Sample rate',
    source: 'bright' as SoundPreset,
    high: { rate: 48000, bits: 16 },
    low: { rate: 8000, bits: 16 },
    question: 'Which version keeps more high-frequency detail?',
    explanation:
      'At 8 kHz, frequencies above 4 kHz cannot be faithfully represented. The low-pass filter removes the 6 kHz tone. Duration and pitch of the remaining tone stay the same.',
  },
  resolution: {
    label: 'Sample resolution',
    source: 'fade' as SoundPreset,
    high: { rate: 48000, bits: 16 },
    low: { rate: 48000, bits: 4 },
    question: 'Which version keeps the fading notes cleaner?',
    explanation:
      'Four bits provide only 16 amplitude levels. Rounding creates more noticeable quantisation error, especially as the notes get quieter. The sample rate is identical.',
  },
  equal: {
    label: 'Same size',
    source: 'drums' as SoundPreset,
    high: { rate: 16000, bits: 4 },
    low: { rate: 8000, bits: 8 },
    question: 'Same size. What changes in the sound?',
    explanation:
      'Both use 64,000 bits per second. One has more samples in time; the other has more amplitude levels. There is no universal winner: it depends on the source.',
  },
};
