import { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Check,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { readTransmission, type TransmissionPlan } from '../lib/transmission';
import type { TransmissionClock } from '../lib/useTransmissionClock';

export const directionNames = {
  simplex: 'Simplex',
  'half-duplex': 'Half-duplex',
  'full-duplex': 'Full-duplex',
};

function ReceivedByte({
  label,
  bits,
  expected,
}: {
  label: string;
  bits: (0 | 1 | null)[];
  expected: string;
}) {
  const count = bits.filter((bit) => bit !== null).length;
  return (
    <div className="tx-receiver">
      <div>
        <span>{label}</span>
        <strong>{count}/8 bits</strong>
      </div>
      <div
        className="tx-received-bits"
        aria-label={`${label}: ${bits.map((bit) => bit ?? 'blank').join(' ')}`}
      >
        {bits.map((bit, index) => (
          <span
            key={index}
            className={
              bit === null
                ? 'tx-bit-empty'
                : String(bit) !== expected[index]
                  ? 'tx-bit-error'
                  : 'tx-bit-arrived'
            }
          >
            <small>b{7 - index}</small>
            {bit ?? '·'}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TransmissionStage({
  plan,
  time,
  started,
  title,
  compact = false,
}: {
  plan: TransmissionPlan;
  time: number;
  started: boolean;
  title: string;
  compact?: boolean;
}) {
  const state = readTransmission(plan, time);
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const titleId = useId();
  useEffect(() => {
    if (!box.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0)
        setWidth(Math.max(240, entry.contentRect.width));
    });
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);
  const { config } = plan;
  const parallel = config.method === 'parallel';
  const duplex = config.mode === 'full-duplex';
  const columns = duplex && width >= 680;
  const panelWidth = columns ? width / 2 : width;
  const lanes = parallel ? 8 : 1;
  const bandHeight = parallel ? 220 : compact ? 96 : 112;
  const height = duplex && !columns ? bandHeight * 2 : bandHeight;
  const currentDirection =
    state.active[0]?.direction ??
    (config.intent === 'b-to-a' ? 'b-to-a' : 'a-to-b');
  const bands = duplex ? (['a-to-b', 'b-to-a'] as const) : [currentDirection];
  const status = !started ? 'Ready to send' : state.directionLabel;

  return (
    <figure
      className={`tx-stage ${compact ? 'tx-stage--compact' : ''}`}
      aria-labelledby={titleId}
    >
      <figcaption className="tx-stage-heading">
        <h3 id={titleId}>{title}</h3>
        <span className="tx-slot-badge">
          {plan.sendSlots} send {plan.sendSlots === 1 ? 'slot' : 'slots'}
        </span>
      </figcaption>
      <div className="tx-device-bar">
        <div className="tx-device tx-device--a">
          <span>
            A <small>Device A</small>
          </span>
          <code>{config.aBits}</code>
        </div>
        <span className="tx-path-label">
          {parallel ? '8 lanes' : '1 lane'}
          {duplex ? ' / direction' : ''}
          <small>Logical data paths</small>
        </span>
        <div className="tx-device tx-device--b">
          <span>
            B <small>Device B</small>
          </span>
          <code>{config.bBits}</code>
        </div>
      </div>
      <div className="tx-diagram" ref={box}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ height }}
          aria-hidden="true"
        >
          {bands.map((direction, band) => {
            const ox = columns ? band * panelWidth : 0;
            const oy = columns ? 0 : band * bandHeight;
            const left = ox + 40;
            const right = ox + panelWidth - 40;
            const reverse = direction === 'b-to-a';
            const bandTransfers = plan.transfers.filter((bit) =>
              duplex ? bit.direction === direction : true,
            );
            return (
              <g key={band}>
                <text
                  className="tx-svg-label"
                  x={ox + panelWidth / 2}
                  y={oy + 22}
                  textAnchor="middle"
                >
                  {duplex
                    ? reverse
                      ? 'B → A'
                      : 'A → B'
                    : config.mode === 'half-duplex'
                      ? 'Shared path · one direction at a time'
                      : 'A → B only'}
                </text>
                {Array.from({ length: lanes }, (_, lane) => {
                  const y =
                    oy + (parallel ? 44 + lane * 22 : compact ? 62 : 72);
                  const live = started
                    ? bandTransfers.filter(
                        (bit) =>
                          bit.lane === lane &&
                          time >= bit.start &&
                          time < bit.end,
                      )
                    : [];
                  return (
                    <g key={lane}>
                      <text className="tx-svg-index" x={ox + 8} y={y + 5}>
                        {parallel ? `b${7 - lane}` : 'A'}
                      </text>
                      <line
                        className="tx-lane"
                        x1={left}
                        y1={y}
                        x2={right}
                        y2={y}
                      />
                      <path
                        className="tx-lane-arrow"
                        d={
                          reverse
                            ? `M ${left + 6} ${y - 4} l -6 4 l 6 4`
                            : `M ${right - 6} ${y - 4} l 6 4 l -6 4`
                        }
                      />
                      <text
                        className="tx-svg-index"
                        x={ox + panelWidth - 24}
                        y={y + 5}
                      >
                        {parallel ? `b${7 - lane}` : 'B'}
                      </text>
                      {live.map((bit) => {
                        const progress = Math.max(
                          0,
                          Math.min(
                            1,
                            (time - bit.start) / (bit.end - bit.start),
                          ),
                        );
                        const backwards = bit.direction === 'b-to-a';
                        const x = backwards
                          ? right - progress * (right - left)
                          : left + progress * (right - left);
                        const flipped = bit.corrupted && progress >= 0.5;
                        return (
                          <g key={bit.id} transform={`translate(${x}, ${y})`}>
                            <rect
                              className={
                                flipped
                                  ? 'tx-token tx-token--error'
                                  : backwards
                                    ? 'tx-token tx-token--b'
                                    : 'tx-token tx-token--a'
                              }
                              x={-15}
                              y={-10}
                              width={30}
                              height={20}
                              rx={6}
                            />
                            <text
                              className="tx-token-value"
                              textAnchor="middle"
                              y={5}
                            >
                              {flipped ? bit.received : bit.sent}
                            </text>
                            {!parallel && (
                              <text
                                className="tx-svg-index"
                                textAnchor="middle"
                                y={-17}
                              >
                                b{7 - bit.index}
                              </text>
                            )}
                            {bit.delayed && time >= bit.start + 1 && (
                              <text className="tx-delay-label" x={20} y={5}>
                                late
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
                {parallel &&
                  config.crosstalk &&
                  started &&
                  bandTransfers.some((bit) => {
                    const progress = (time - bit.start) / (bit.end - bit.start);
                    return bit.corrupted && progress >= 0.35 && progress < 0.8;
                  }) && (
                    <g
                      className={`tx-crosstalk-mark ${config.distance === 'long' ? 'tx-crosstalk-mark--strong' : ''}`}
                    >
                      <path
                        d={`M ${ox + panelWidth / 2} ${oy + 110} l 8 7 l -12 8 l 8 7`}
                      />
                      <text x={ox + panelWidth / 2 + 18} y={oy + 125}>
                        interference
                      </text>
                    </g>
                  )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="tx-receiver-row">
        <ReceivedByte
          label="Received at A"
          bits={state.receivedA}
          expected={config.bBits}
        />
        <ReceivedByte
          label="Received at B"
          bits={state.receivedB}
          expected={config.aBits}
        />
      </div>
      <div
        className={`tx-board-status ${started && state.complete ? 'tx-board-status--complete' : ''}`}
      >
        {started && state.complete ? (
          <Check size={16} />
        ) : duplex ? (
          <ArrowRightLeft size={16} />
        ) : currentDirection === 'b-to-a' ? (
          <ArrowLeft size={16} />
        ) : (
          <ArrowRight size={16} />
        )}
        <span>{status}</span>
        {started && state.waitingB && (
          <strong>
            {config.mode === 'simplex' ? 'B: no return path' : 'B: waiting'}
          </strong>
        )}
        {started && state.waitingA && <strong>A: waiting</strong>}
      </div>
    </figure>
  );
}

export function PlaybackControls({
  clock,
  children,
}: {
  clock: TransmissionClock;
  children?: React.ReactNode;
}) {
  return (
    <div className="tx-playback">
      <div className="tx-actions">
        {children}
        <Button
          variant="outline"
          disabled={!clock.started || clock.complete}
          onClick={clock.toggle}
        >
          {clock.running ? <Pause /> : <Play />}
          {clock.running ? 'Pause' : 'Resume'}
        </Button>
        <Button
          variant="outline"
          disabled={clock.complete}
          onClick={clock.step}
        >
          <SkipForward />
          Step
        </Button>
        <Button variant="ghost" disabled={!clock.started} onClick={clock.play}>
          <RotateCcw />
          Replay
        </Button>
      </div>
      <label className="tx-speed">
        Animation speed
        <select
          value={clock.speed}
          onChange={(event) => clock.setSpeed(Number(event.target.value))}
        >
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
        </select>
      </label>
      {clock.reducedMotion && (
        <span className="tx-motion-note">Reduced motion · discrete steps</span>
      )}
    </div>
  );
}
