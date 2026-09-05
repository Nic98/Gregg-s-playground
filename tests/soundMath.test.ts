import { describe, expect, it } from 'vitest';
import {
  listeningExperiments,
  makeSound,
  processSound,
  quantise,
  resample,
  SOURCE_RATE,
} from '../src/lib/soundMath';

describe('sound sampling', () => {
  it('rounds to an unsigned b-bit code and reconstructs the same level', () => {
    expect(quantise(-1, 3)).toEqual({ code: 0, amplitude: -1 });
    expect(quantise(1, 3)).toEqual({ code: 7, amplitude: 1 });
    expect(quantise(0.6, 3).code).toBe(6);
    expect(quantise(2, 4).code).toBe(15);
    expect(quantise(-2, 4).code).toBe(0);
  });
  it('retains sample count, duration, bit count and decoded sample consistency', () => {
    const result = processSound(makeSound('tone', 0.25), SOURCE_RATE, 8000, 4);
    expect(result.samples.length).toBe(2000);
    expect(result.duration).toBe(0.25);
    expect(result.totalBits).toBe(8000);
    result.codes.forEach((code, i) =>
      expect(result.samples[i]).toBeCloseTo((code / 15) * 2 - 1, 6),
    );
  });
  it('uses all advertised levels without modifying the source', () => {
    const source = Float32Array.from(
      { length: 65536 },
      (_, i) => (i / 65535) * 2 - 1,
    );
    for (const bits of [2, 3, 4, 6, 8, 12, 16]) {
      const result = processSound(source, SOURCE_RATE, SOURCE_RATE, bits);
      expect(new Set(result.codes).size).toBe(2 ** bits);
      expect(result.totalBits).toBe(source.length * bits);
    }
    expect(source[0]).toBe(-1);
    expect(source[source.length - 1]).toBe(1);
  });
  it('reduces amplitude error at higher sample resolution', () => {
    const source = makeSound('fade', 0.1);
    const error = (bits: number) =>
      processSound(source, SOURCE_RATE, SOURCE_RATE, bits).samples.reduce(
        (sum, value, i) => sum + (value - source[i]) ** 2,
        0,
      );
    expect(error(16)).toBeLessThan(error(4) / 1000);
  });
  it('removes high-frequency detail when reducing rate, without slowing the clip', () => {
    const source = makeSound('bright', 0.2);
    const reduced = resample(source, SOURCE_RATE, 8000);
    let error = 0,
      count = 0;
    for (let i = 100; i < reduced.length - 100; i++) {
      error +=
        (reduced[i] - 0.42 * Math.sin((2 * Math.PI * 440 * i) / 8000)) ** 2;
      count++;
    }
    expect(Math.sqrt(error / count)).toBeLessThan(0.01);
    expect(reduced.length / 8000).toBe(source.length / SOURCE_RATE);
  });
  it('creates deterministic sources and independent identity-rate copies', () => {
    const source = makeSound('drums', 0.1);
    expect(source).toEqual(makeSound('drums', 0.1));
    const copy = resample(source, SOURCE_RATE, SOURCE_RATE);
    expect(copy).toEqual(source);
    expect(copy).not.toBe(source);
  });
  it('isolates one setting per blind trial and preserves equal-size arithmetic', () => {
    const { rate, resolution, equal } = listeningExperiments;
    expect(rate.high.bits).toBe(rate.low.bits);
    expect(resolution.high.rate).toBe(resolution.low.rate);
    expect(equal.high.rate * equal.high.bits).toBe(
      equal.low.rate * equal.low.bits,
    );
    expect((equal.high.rate * equal.high.bits * 3) / 8).toBe(24000);
  });
});
