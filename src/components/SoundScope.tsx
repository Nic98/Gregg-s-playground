import type { ProcessedSound } from '../lib/soundMath';
import { SOURCE_RATE } from '../lib/soundMath';

export function SoundScope({
  source,
  processed,
  offset,
  windowMs,
  selected,
  onSelect,
  compact = false,
}: {
  source: Float32Array;
  processed: ProcessedSound;
  offset: number;
  windowMs: number;
  selected: number;
  onSelect?: (index: number) => void;
  compact?: boolean;
}) {
  const width = 800,
    height = 240,
    top = 18,
    bottom = 218;
  const first = Math.floor(offset * processed.rate);
  const count = Math.min(
    Math.round((windowMs / 1000) * processed.rate),
    processed.samples.length - first,
  );
  const y = (value: number) => top + ((1 - value) / 2) * (bottom - top);
  const x = (index: number) =>
    20 + (index / Math.max(1, count - 1)) * (width - 40);
  const original = Array.from({ length: 500 }, (_, i) => {
    const time = offset + ((i / 499) * Math.max(0, count - 1)) / processed.rate;
    return `${i ? 'L' : 'M'}${20 + (i / 499) * 760},${y(source[Math.min(source.length - 1, Math.round(time * SOURCE_RATE))] ?? 0)}`;
  }).join(' ');
  const digital = Array.from(
    { length: count },
    (_, i) => `${i ? 'L' : 'M'}${x(i)},${y(processed.samples[first + i])}`,
  ).join(' ');
  const levels = Math.min(2 ** processed.bits, 16);
  // The SVG is a keyboard slider when selectable and an image in the read-only reveal.
  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <svg
      className={`sound-scope ${compact ? 'sound-scope--compact' : ''}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role={onSelect ? 'slider' : 'img'}
      tabIndex={onSelect ? 0 : undefined}
      aria-valuemin={onSelect ? first + 1 : undefined}
      aria-valuemax={onSelect ? first + count : undefined}
      aria-valuenow={onSelect ? selected + 1 : undefined}
      aria-label={`Waveform: ${processed.rate.toLocaleString()} samples per second, ${processed.bits} bits per sample. ${windowMs} millisecond window.${onSelect ? ' Use arrow keys to select a sample.' : ''}`}
      onKeyDown={
        onSelect
          ? (event) => {
              if (
                ![
                  'ArrowLeft',
                  'ArrowRight',
                  'ArrowUp',
                  'ArrowDown',
                  'Home',
                  'End',
                ].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === 'Home'
                  ? first
                  : event.key === 'End'
                    ? first + count - 1
                    : selected +
                      (event.key === 'ArrowRight' || event.key === 'ArrowUp'
                        ? 1
                        : -1);
              onSelect(Math.max(first, Math.min(first + count - 1, next)));
            }
          : undefined
      }
      onClick={
        onSelect
          ? (event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const fraction =
                (((event.clientX - bounds.left) / bounds.width) * width - 20) /
                760;
              onSelect(
                first +
                  Math.max(
                    0,
                    Math.min(count - 1, Math.round(fraction * (count - 1))),
                  ),
              );
            }
          : undefined
      }
    >
      {Array.from({ length: levels }, (_, i) => (
        <line
          key={i}
          x1="20"
          x2="780"
          y1={y((i / (levels - 1)) * 2 - 1)}
          y2={y((i / (levels - 1)) * 2 - 1)}
          className="scope-level"
        />
      ))}
      <path d={original} className="scope-original" />
      {!compact &&
        count <= 180 &&
        Array.from({ length: count }, (_, i) => (
          <line
            key={i}
            x1={x(i)}
            x2={x(i)}
            y1={y(0)}
            y2={y(processed.samples[first + i])}
            className="scope-stem"
          />
        ))}
      <path d={digital} className="scope-digital" />
      {!compact &&
        count <= 180 &&
        Array.from({ length: count }, (_, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(processed.samples[first + i])}
            r="3"
            className="scope-dot"
          />
        ))}
      {!compact && selected >= first && selected < first + count && (
        <>
          <line
            x1={x(selected - first)}
            x2={x(selected - first)}
            y1="10"
            y2="230"
            className="scope-selection"
          />
          <circle
            cx={x(selected - first)}
            cy={y(processed.samples[selected])}
            r="7"
            className="scope-selected"
          />
        </>
      )}
    </svg>
  );
}
