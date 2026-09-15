// oxlint-disable jsx-a11y/prefer-tag-over-role -- Live canvas and inline SVG need image semantics; an img cannot contain or draw these data visualisations.
import { useEffect, useRef } from 'react';
import { SOURCE_RATE, type ProcessedSound } from '../lib/soundMath';
import { type QualityImage } from '../lib/qualityLab';

export function PixelPreview({
  data,
  label,
}: {
  data: QualityImage;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const pixels = document.createElement('canvas');
    pixels.width = pixels.height = data.width;
    const pixelContext = pixels.getContext('2d');
    const context = canvas.getContext('2d');
    if (!pixelContext || !context) return;
    const raster = pixelContext.createImageData(data.width, data.width);
    data.indices.forEach((index, i) => {
      const colour = data.palette[index];
      raster.data.set([colour.r, colour.g, colour.b, 255], i * 4);
    });
    pixelContext.putImageData(raster, 0, 0);
    const draw = () => {
      const side = Math.round(
        canvas.getBoundingClientRect().width * (window.devicePixelRatio || 1),
      );
      if (!side) return;
      canvas.width = canvas.height = side;
      context.imageSmoothingEnabled = false;
      context.drawImage(pixels, 0, 0, side, side);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    window.addEventListener('resize', draw);
    draw();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', draw);
    };
  }, [data]);
  return (
    <canvas
      className="quality-pixels"
      ref={ref}
      role="img"
      aria-label={label}
    />
  );
}

export function WavePreview({
  source,
  processed,
  quiet,
  label,
}: {
  source: Float32Array;
  processed: ProcessedSound;
  quiet: boolean;
  label: string;
}) {
  // Both panels use exactly the same 8 ms window, origin and ±1 amplitude scale.
  const offset = quiet ? 1 : 0.25;
  const duration = 0.008;
  const x = (seconds: number) => 32 + ((seconds - offset) / duration) * 536;
  const y = (amplitude: number) => 105 - amplitude * 80;
  const start = Math.round(offset * processed.rate);
  const count = Math.floor(duration * processed.rate);
  const original = Array.from({ length: 385 }, (_, i) => {
    const t = offset + (i / 384) * duration;
    return `${i ? 'L' : 'M'}${x(t).toFixed(2)},${y(source[Math.round(t * SOURCE_RATE)] ?? 0).toFixed(2)}`;
  }).join(' ');
  let steps = `M32,${y(processed.samples[start])}`;
  for (let i = 0; i < count; i++) {
    steps += ` H${x((start + i + 1) / processed.rate).toFixed(2)} V${y(processed.samples[start + i + 1]).toFixed(2)}`;
  }
  return (
    <div className="quality-scope">
      <div className="quality-scope-label">
        <span>Amplitude −1 to +1</span>
        <span>8 ms detail</span>
      </div>
      <svg viewBox="0 0 600 225" role="img" aria-label={label}>
        {[-1, -0.5, 0, 0.5, 1].map((level) => (
          <line
            key={level}
            x1="32"
            x2="568"
            y1={y(level)}
            y2={y(level)}
            className="quality-scope-grid"
          />
        ))}
        {[0, 2, 4, 6, 8].map((ms) => (
          <g key={ms}>
            <line
              x1={32 + (ms / 8) * 536}
              x2={32 + (ms / 8) * 536}
              y1="25"
              y2="185"
              className="quality-scope-grid"
            />
            <text x={32 + (ms / 8) * 536} y="216" textAnchor="middle">
              {ms} ms
            </text>
          </g>
        ))}
        <path d={original} className="quality-source-line" />
        <path d={steps} className="quality-sample-line" />
        {Array.from({ length: count + 1 }, (_, i) => (
          <circle
            key={i}
            cx={x((start + i) / processed.rate)}
            cy={y(processed.samples[start + i])}
            r={count > 100 ? 1.5 : 3}
            className="quality-sample-dot"
          />
        ))}
      </svg>
      <div className="quality-scope-label">
        <span>— Original signal</span>
        <span>● Encoded samples</span>
      </div>
    </div>
  );
}
