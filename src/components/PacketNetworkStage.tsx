import { useEffect, useId, useRef, useState } from 'react';
import { Check, CornerUpLeft, Mail, TriangleAlert } from 'lucide-react';
import {
  PACKET_DESTINATION_IP,
  PACKET_SOURCE_IP,
  type PacketJourneySnapshot,
} from '../lib/packetSwitching';
import '../packet-network.css';

type Point = { x: number; y: number };

/** The model's progress stops are logical hops, not physical distances. */
function routePoint(progress: number, points: Point[]): Point {
  const stops = [0, 0.2, 0.5, 0.8, 1];
  const clamped = Math.max(0, Math.min(1, progress));
  const end = stops.findIndex((stop) => stop > clamped);
  if (end === -1) return points[4];
  const start = Math.max(0, end - 1);
  const fraction = (clamped - stops[start]) / (stops[end] - stops[start]);
  return {
    x: points[start].x + (points[end].x - points[start].x) * fraction,
    y: points[start].y + (points[end].y - points[start].y) * fraction,
  };
}

function linePath(points: Point[]) {
  return points
    .map(({ x, y }, index) => `${index ? 'L' : 'M'}${x},${y}`)
    .join(' ');
}

export function PacketNetworkStage({
  snapshot,
  selectedPacket,
  onSelectPacket,
}: {
  snapshot: PacketJourneySnapshot;
  selectedPacket: number;
  onSelectPacket: (number: number) => void;
}) {
  const frame = useRef<HTMLFieldSetElement>(null);
  const [width, setWidth] = useState(760);
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!frame.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);

  const vertical = width < 560;
  const height = vertical ? 370 : 268;
  const middle = width / 2;
  const source = vertical ? { x: middle, y: 66 } : { x: 68, y: 139 };
  const destination = vertical
    ? { x: middle, y: 304 }
    : { x: width - 68, y: 139 };
  const r1 = vertical ? { x: middle, y: 110 } : { x: width * 0.29, y: 139 };
  const upper = vertical
    ? { x: middle - Math.min(92, width * 0.27), y: 204 }
    : { x: middle, y: 59 };
  const lower = vertical
    ? { x: middle + Math.min(92, width * 0.27), y: 204 }
    : { x: middle, y: 219 };
  const r4 = vertical ? { x: middle, y: 256 } : { x: width * 0.71, y: 139 };
  const paths = {
    upper: [source, r1, upper, r4, destination],
    lower: [source, r1, lower, r4, destination],
  };
  const routers = [r1, upper, lower, r4];
  const activePackets = snapshot.packets.filter((packet) =>
    ['travelling', 'resending'].includes(packet.status),
  );
  const queuedAtRouter = activePackets.filter(
    (packet) => packet.attempt === 1 && packet.progress === 0.2,
  );
  const request = snapshot.requestProgress;
  const requestPoint =
    request === null ? null : routePoint(1 - request, paths.upper);
  const stageLabel =
    request !== null
      ? 'Requesting packet 3'
      : activePackets.some((packet) => packet.attempt === 2)
        ? 'Only packet 3 is resent'
        : queuedAtRouter.length
          ? `${queuedAtRouter.length} ${queuedAtRouter.length === 1 ? 'packet' : 'packets'} queued at R1`
          : snapshot.allValid
            ? 'All four packets received'
            : snapshot.stage >= 6 &&
                snapshot.packets.some((packet) => packet.status === 'damaged')
              ? 'Packet 3 rejected · checksum mismatch'
              : snapshot.stage >= 6 && snapshot.scenario === 'missing'
                ? 'Waiting for packet 3'
                : snapshot.stage >= 4
                  ? 'Packets travel independently'
                  : 'Four packets. One message.';

  function parkedPoint(number: number, atReceiver: boolean): Point {
    const centre = atReceiver ? destination : source;
    return vertical
      ? { x: centre.x + (number - 2.5) * 49, y: centre.y }
      : {
          x: centre.x + (number % 2 === 0 ? 24 : -24),
          y: centre.y + (number > 2 ? 25 : -25),
        };
  }

  function routerQueuePoint(number: number): Point {
    return {
      x: r1.x + (number - 2.5) * 49,
      y: vertical ? 154 : 25,
    };
  }

  return (
    <figure className="packet-network" aria-labelledby={headingId}>
      <figcaption className="packet-network__heading">
        <h2 id={headingId}>One message, many paths.</h2>
        <span>Router network</span>
      </figcaption>
      <p className="sr-only" id={descriptionId}>
        Sender {PACKET_SOURCE_IP} sends four numbered packets through routers
        R1, R2 or R3, and R4 to receiver {PACKET_DESTINATION_IP}. Select a
        numbered packet to inspect its contents. {stageLabel}.
      </p>
      <fieldset
        className={`packet-network__canvas ${vertical ? 'packet-network__canvas--vertical' : ''}`}
        style={{ height }}
        ref={frame}
        aria-describedby={descriptionId}
        aria-label="Packet journey network"
      >
        <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <path className="packet-network__link" d={linePath(paths.upper)} />
          <path className="packet-network__link" d={linePath(paths.lower)} />
          {activePackets.map((packet) => {
            const points = paths[packet.route];
            const stops = [0, 0.2, 0.5, 0.8, 1];
            const endIndex = stops.findIndex((stop) => stop > packet.progress);
            const segment = Math.max(0, (endIndex === -1 ? 4 : endIndex) - 1);
            return (
              <path
                key={packet.number}
                className={`packet-network__active-link ${packet.attempt === 2 ? 'packet-network__active-link--resend' : ''}`}
                d={linePath([points[segment], points[segment + 1]])}
              />
            );
          })}
          {request !== null && (
            <path
              className="packet-network__request-link"
              d={linePath(paths.upper)}
            />
          )}
          {queuedAtRouter.length > 0 && (
            <>
              <path
                className="packet-network__queue-link"
                d={
                  vertical
                    ? `M${r1.x},${r1.y + 21} V132`
                    : `M${r1.x},73 V${r1.y - 21}`
                }
              />
              <text
                className="packet-network__route-label"
                x={vertical ? r1.x - 35 : r1.x}
                y={vertical ? r1.y + 5 : 64}
                textAnchor={vertical ? 'end' : 'middle'}
              >
                R1 queue
              </text>
            </>
          )}
          {vertical ? (
            <>
              <rect
                className="packet-network__endpoint packet-network__endpoint--sender"
                x={8}
                y={3}
                width={width - 16}
                height={90}
                rx={15}
              />
              <rect
                className="packet-network__endpoint packet-network__endpoint--receiver"
                x={8}
                y={277}
                width={width - 16}
                height={90}
                rx={15}
              />
              <text className="packet-network__endpoint-title" x={24} y={27}>
                Sender
              </text>
              <text
                className="packet-network__ip"
                textAnchor="end"
                x={width - 24}
                y={27}
              >
                {PACKET_SOURCE_IP}
              </text>
              <text className="packet-network__endpoint-title" x={24} y={349}>
                Receiver
              </text>
              <text
                className="packet-network__ip"
                textAnchor="end"
                x={width - 24}
                y={349}
              >
                {PACKET_DESTINATION_IP}
              </text>
            </>
          ) : (
            <>
              <rect
                className="packet-network__endpoint packet-network__endpoint--sender"
                x={9}
                y={61}
                width={118}
                height={160}
                rx={17}
              />
              <rect
                className="packet-network__endpoint packet-network__endpoint--receiver"
                x={width - 127}
                y={61}
                width={118}
                height={160}
                rx={17}
              />
              <text
                className="packet-network__endpoint-title"
                textAnchor="middle"
                x={source.x}
                y={86}
              >
                Sender
              </text>
              <text
                className="packet-network__ip"
                textAnchor="middle"
                x={source.x}
                y={206}
              >
                {PACKET_SOURCE_IP}
              </text>
              <text
                className="packet-network__endpoint-title"
                textAnchor="middle"
                x={destination.x}
                y={86}
              >
                Receiver
              </text>
              <text
                className="packet-network__ip"
                textAnchor="middle"
                x={destination.x}
                y={206}
              >
                {PACKET_DESTINATION_IP}
              </text>
            </>
          )}
          {routers.map((point, index) => {
            const active = activePackets.some((packet) => {
              const p = routePoint(packet.progress, paths[packet.route]);
              return Math.hypot(p.x - point.x, p.y - point.y) < 29;
            });
            return (
              <g key={index} transform={`translate(${point.x},${point.y})`}>
                <rect
                  className={`packet-network__router ${active ? 'packet-network__router--active' : ''}`}
                  x={-22}
                  y={-21}
                  width={44}
                  height={42}
                  rx={12}
                />
                <text
                  className="packet-network__router-label"
                  textAnchor="middle"
                  y={5}
                >
                  R{index + 1}
                </text>
              </g>
            );
          })}
          {snapshot.packets.map((packet) => {
            const point = parkedPoint(packet.number, true);
            return (
              <g key={packet.number}>
                <rect
                  className="packet-network__socket"
                  x={point.x - 19}
                  y={point.y - 19}
                  width={38}
                  height={38}
                  rx={10}
                />
                <text
                  className="packet-network__socket-label"
                  x={point.x}
                  y={point.y + 5}
                  textAnchor="middle"
                >
                  {packet.number}
                </text>
              </g>
            );
          })}
          {!vertical && (
            <>
              <text
                className="packet-network__route-label"
                x={middle}
                y={17}
                textAnchor="middle"
              >
                Via R2
              </text>
              <text
                className="packet-network__route-label"
                x={middle}
                y={264}
                textAnchor="middle"
              >
                Via R3
              </text>
            </>
          )}
        </svg>
        {snapshot.time === 0 && (
          <div
            className="packet-network__message"
            style={{ left: source.x, top: source.y }}
          >
            <Mail aria-hidden="true" />
            <span>
              MEET ME
              <br />
              AT NOON.
            </span>
          </div>
        )}
        {snapshot.packets
          .filter(
            (packet) =>
              snapshot.stage > 1 ||
              packet.number <= Math.ceil(snapshot.stageProgress * 4),
          )
          .map((packet) => {
            const lost = packet.status === 'missing';
            const moving = ['travelling', 'resending'].includes(packet.status);
            const arrived = ['arrived', 'valid', 'damaged'].includes(
              packet.status,
            );
            const point = lost
              ? routePoint(0.55, paths[packet.route])
              : moving
                ? packet.attempt === 1 && packet.progress === 0.2
                  ? routerQueuePoint(packet.number)
                  : routePoint(packet.progress, [
                      ...paths[packet.route].slice(0, 4),
                      parkedPoint(packet.number, true),
                    ])
                : parkedPoint(packet.number, arrived);
            const error = packet.corrupted || packet.status === 'damaged';
            return (
              <button
                key={packet.number}
                type="button"
                className={`packet-network__packet ${selectedPacket === packet.number ? 'packet-network__packet--selected' : ''} ${error ? 'packet-network__packet--damaged' : ''} ${lost ? 'packet-network__packet--missing' : ''} ${packet.status === 'valid' ? 'packet-network__packet--valid' : ''} ${packet.attempt === 2 ? 'packet-network__packet--resent' : ''}`}
                style={{ left: point.x, top: point.y }}
                onClick={() => onSelectPacket(packet.number)}
                aria-pressed={selectedPacket === packet.number}
                aria-label={`Inspect packet ${packet.number}: ${packet.status}${packet.attempt === 2 ? ', retransmitted' : ''}`}
              >
                <span>{packet.number}</span>
                {lost ? (
                  <span
                    className="packet-network__packet-symbol"
                    aria-hidden="true"
                  >
                    ×
                  </span>
                ) : error ? (
                  <TriangleAlert aria-hidden="true" />
                ) : packet.status === 'valid' ? (
                  <Check aria-hidden="true" />
                ) : packet.attempt === 2 ? (
                  <CornerUpLeft aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        {requestPoint && (
          <div
            className="packet-network__request"
            style={{ left: requestPoint.x, top: requestPoint.y }}
            aria-hidden="true"
          >
            <CornerUpLeft />
            <span>Resend 3</span>
          </div>
        )}
      </fieldset>
      <div className="packet-network__caption">
        <span
          className={`packet-network__status-dot ${snapshot.allValid ? 'packet-network__status-dot--complete' : ''}`}
          aria-hidden="true"
        />
        <span>{stageLabel}</span>
        <span className="packet-network__caption-note">
          Illustrative routes
        </span>
      </div>
    </figure>
  );
}
