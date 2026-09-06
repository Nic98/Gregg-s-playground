import { describe, expect, it } from 'vitest';
import { journeyAmplitude, journeySamples } from '../src/lib/soundJourney';

describe('classroom sound signal', () => {
  it('matches the lesson encoding and uses ten 8 Hz samples', () => {
    expect(journeySamples.map((sample) => sample.code).join(' ')).toBe(
      '0010 0011 0101 1000 0101 0010 0011 0100 0101 0011',
    );
    expect(journeySamples.map((sample) => sample.time)).toEqual([
      0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.125,
    ]);
  });
  it('keeps the continuous signal aligned with every measured sample', () => {
    for (const sample of journeySamples)
      expect(journeyAmplitude(sample.time)).toBeCloseTo(sample.measured, 10);
    for (let i = 0; i <= 1000; i++) {
      expect(journeyAmplitude(i / 800)).toBeGreaterThanOrEqual(0);
      expect(journeyAmplitude(i / 800)).toBeLessThanOrEqual(15);
    }
  });
});
