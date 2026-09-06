/** The same illustrative signal and unsigned 4-bit levels used in the lesson. */
export const journeyRate = 8;
export const journeyBits = 4;
export const journeyDuration = 1.25;
export const journeySamples = [
  2.2, 3.3, 5.2, 7.8, 5.1, 2.3, 3.2, 4.1, 5.2, 3.1,
].map((measured, index) => ({
  time: index / journeyRate,
  measured,
  level: Math.round(measured),
  code: Math.round(measured).toString(2).padStart(journeyBits, '0'),
}));

// Cubic Hermite interpolation is a teaching illustration, not audio reconstruction.
export function journeyAmplitude(time: number): number {
  const anchors = [...journeySamples.map((sample) => sample.measured), 2.4];
  const position = Math.max(0, Math.min(journeyDuration, time)) * journeyRate;
  const i = Math.min(anchors.length - 2, Math.floor(position));
  const u = position - i;
  const start = anchors[i];
  const end = anchors[i + 1];
  const m0 = i === 0 ? end - start : (end - anchors[i - 1]) / 2;
  const m1 =
    i === anchors.length - 2 ? end - start : (anchors[i + 2] - start) / 2;
  return (
    (2 * u ** 3 - 3 * u ** 2 + 1) * start +
    (u ** 3 - 2 * u ** 2 + u) * m0 +
    (-2 * u ** 3 + 3 * u ** 2) * end +
    (u ** 3 - u ** 2) * m1
  );
}
