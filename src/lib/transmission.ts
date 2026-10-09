export type TransmissionMethod = 'serial' | 'parallel';
export type DirectionMode = 'simplex' | 'half-duplex' | 'full-duplex';
export type TransmissionView = 'mix' | 'methods' | 'directions';
export type SendIntent = 'a-to-b' | 'b-to-a' | 'both';
export type TransmissionDirection = Exclude<SendIntent, 'both'>;
export type BitValue = 0 | 1;

export interface TransmissionConfig {
  method: TransmissionMethod;
  mode: DirectionMode;
  aBits: string;
  bBits: string;
  intent: SendIntent;
  distance: 'short' | 'long';
  skew: boolean;
  crosstalk: boolean;
}

export interface BitTransfer {
  id: string;
  direction: TransmissionDirection;
  /** Position 0 is b7, position 7 is b0; skew never changes this position. */
  index: number;
  lane: number;
  sent: BitValue;
  received: BitValue;
  start: number;
  end: number;
  corrupted: boolean;
  delayed: boolean;
}

export interface TransmissionPlan {
  config: TransmissionConfig;
  transfers: BitTransfer[];
  /** Sending slots at the same per-lane rate, excluding illustrative delay. */
  sendSlots: number;
  duration: number;
}

export interface TransmissionSnapshot {
  receivedA: (BitValue | null)[];
  receivedB: (BitValue | null)[];
  active: BitTransfer[];
  waitingA: boolean;
  waitingB: boolean;
  complete: boolean;
  directionLabel: string;
}

const skewOffsets = [0, 0.125, 0.25, 0.375, 0.5, 0.125, 0.25, 0.375];

function sanitiseByte(bits: string): string {
  return bits.replace(/[^01]/g, '').slice(0, 8).padEnd(8, '0');
}

/** Logical data lanes, not a physical-wire count; no protocol overhead. */
export function buildTransmission(input: TransmissionConfig): TransmissionPlan {
  const config: TransmissionConfig = {
    ...input,
    aBits: sanitiseByte(input.aBits),
    bBits: sanitiseByte(input.bBits),
  };
  const parallel = config.method === 'parallel';
  const oneWaySlots = parallel ? 1 : 8;
  const sendA = config.intent !== 'b-to-a';
  const sendB = config.mode !== 'simplex' && config.intent !== 'a-to-b';
  const transfers: BitTransfer[] = [];

  const addByte = (
    direction: TransmissionDirection,
    bits: string,
    offset: number,
  ) => {
    for (let index = 0; index < 8; index += 1) {
      const start = offset + (parallel ? 0 : index);
      // Distance only amplifies an enabled teaching effect, not a real limit.
      const delay =
        parallel && config.skew
          ? skewOffsets[index] * (config.distance === 'long' ? 3 : 1)
          : 0;
      const sent: BitValue = bits[index] === '1' ? 1 : 0;
      const corrupted = parallel && config.crosstalk && index === 4;
      transfers.push({
        id: `${direction}-${index}`,
        direction,
        index,
        lane: parallel ? index : 0,
        sent,
        received: corrupted ? (sent === 0 ? 1 : 0) : sent,
        start,
        end: start + 1 + delay,
        corrupted,
        delayed: delay > 0,
      });
    }
  };

  if (sendA) addByte('a-to-b', config.aBits, 0);
  if (sendB) {
    // A half-duplex handover waits for every A bit, including delayed lanes.
    const offset =
      sendA && config.mode === 'half-duplex'
        ? Math.max(...transfers.map((transfer) => transfer.end))
        : 0;
    addByte('b-to-a', config.bBits, offset);
  }

  const sequentialBytes =
    sendA && sendB && config.mode === 'half-duplex' ? 2 : 1;
  return {
    config,
    transfers,
    sendSlots: transfers.length === 0 ? 0 : oneWaySlots * sequentialBytes,
    duration: Math.max(0, ...transfers.map((transfer) => transfer.end)),
  };
}

/** Receiver state and moving bits are both derived from the same clock. */
export function readTransmission(
  plan: TransmissionPlan,
  time: number,
): TransmissionSnapshot {
  const clock = Number.isNaN(time) ? 0 : Math.max(0, time);
  const receivedA: (BitValue | null)[] = Array(8).fill(null);
  const receivedB: (BitValue | null)[] = Array(8).fill(null);
  const active: BitTransfer[] = [];

  for (const transfer of plan.transfers) {
    if (transfer.end <= clock) {
      const receiver = transfer.direction === 'a-to-b' ? receivedB : receivedA;
      receiver[transfer.index] = transfer.received;
    } else if (transfer.start <= clock) {
      active.push(transfer);
    }
  }

  const firstStart = (direction: TransmissionDirection) =>
    Math.min(
      ...plan.transfers
        .filter((transfer) => transfer.direction === direction)
        .map((transfer) => transfer.start),
    );
  const blockedB =
    plan.config.mode === 'simplex' && plan.config.intent !== 'a-to-b';
  const aStart = firstStart('a-to-b');
  const bStart = firstStart('b-to-a');
  const waitingA = Number.isFinite(aStart) && clock < aStart;
  const waitingB = blockedB || (Number.isFinite(bStart) && clock < bStart);
  const complete = clock >= plan.duration;
  const activeA = active.some((transfer) => transfer.direction === 'a-to-b');
  const activeB = active.some((transfer) => transfer.direction === 'b-to-a');

  let directionLabel = 'Ready';
  if (activeA && activeB) directionLabel = 'A → B and B → A simultaneously';
  else if (activeA)
    directionLabel = waitingB
      ? blockedB
        ? 'A → B · B cannot reply on this link'
        : 'A → B · B is waiting'
      : 'A → B';
  else if (activeB) directionLabel = 'B → A';
  else if (complete)
    directionLabel = blockedB
      ? 'One-way link · B cannot send back'
      : 'Transfer complete';

  return {
    receivedA,
    receivedB,
    active,
    waitingA,
    waitingB,
    complete,
    directionLabel,
  };
}
