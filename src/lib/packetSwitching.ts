export type PacketScenario = 'clean' | 'missing' | 'damaged';
export type PacketStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type PacketStatus =
  | 'queued'
  | 'travelling'
  | 'arrived'
  | 'valid'
  | 'damaged'
  | 'missing'
  | 'resending';

export const PACKET_MESSAGE = 'MEET ME AT NOON.';
export const PACKET_SOURCE_IP = '192.0.2.10';
export const PACKET_DESTINATION_IP = '198.51.100.20';
export const PACKET_DURATION = 30;

export interface PacketStageDefinition {
  number: PacketStage;
  label: string;
  description: string;
  start: number;
  end: number;
}

export const PACKET_STAGES: readonly PacketStageDefinition[] = [
  {
    number: 1,
    label: 'Split',
    description: 'The sender splits the message into four payloads.',
    start: 0,
    end: 2,
  },
  {
    number: 2,
    label: 'Add headers',
    description:
      'Each header identifies the sender, destination and packet number.',
    start: 2,
    end: 4,
  },
  {
    number: 3,
    label: 'Add a trailer',
    description: 'An error-checking value travels with each payload.',
    start: 4,
    end: 6,
  },
  {
    number: 4,
    label: 'Send',
    description: 'The sender passes the packets to the first router.',
    start: 6,
    end: 9,
  },
  {
    number: 5,
    label: 'Route',
    description:
      'Packets can take different available routes and arrive out of order.',
    start: 9,
    end: 17,
  },
  {
    number: 6,
    label: 'Check',
    description:
      'The receiver checks each packet and looks for missing numbers.',
    start: 17,
    end: 21,
  },
  {
    number: 7,
    label: 'Request again',
    description: 'Only missing or damaged packets need to be sent again.',
    start: 21,
    end: 27,
  },
  {
    number: 8,
    label: 'Reassemble',
    description:
      'The receiver puts valid packets in number order to restore the message.',
    start: 27,
    end: 30,
  },
];

export interface JourneyPacket {
  number: number;
  payload: string;
  receivedPayload: string;
  /** Checksum stored in the transmitted trailer. */
  checksum: number;
  /** Recomputed checksum of receivedPayload; not a replacement trailer. */
  receivedChecksum: number;
  route: 'upper' | 'lower';
  /** Whole-path fraction: sender 0, R1 .2, branch .5, R4 .8, receiver 1. */
  progress: number;
  status: PacketStatus;
  attempt: 1 | 2;
  checked: boolean;
  corrupted: boolean;
}

export interface PacketArrival {
  id: string;
  number: number;
  payload: string;
  attempt: 1 | 2;
  /** Null means received but not checked yet. */
  valid: boolean | null;
}

export interface PacketJourneySnapshot {
  scenario: PacketScenario;
  time: number;
  stage: PacketStage;
  stageProgress: number;
  completedStages: PacketStage[];
  packets: JourneyPacket[];
  arrivalOrder: number[];
  arrivals: PacketArrival[];
  receivedNumbers: number[];
  /** Return-direction fraction: receiver 0, sender 1; null when inactive. */
  requestProgress: number | null;
  timeoutProgress: number;
  allValid: boolean;
  reassembled: string | null;
  complete: boolean;
}

const PAYLOADS = ['MEET', ' ME ', 'AT N', 'OON.'] as const;
// Arrival and checking schedules are independent from the SVG geometry.
const FIRST_ARRIVALS = [13.2, 12, 16.4, 14.8];
const FIRST_CHECKS = [18.4, 17.6, 20.2, 19.2];
const REQUEST_START = 21;
const REQUEST_END = 22.2;
const RESEND_START = 23;
const RESEND_ARRIVAL = 26;
const RESEND_CHECK = 26.5;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Simplified 8-bit ASCII sum checksum, not CRC or error correction. */
export function checksum(payload: string): number {
  return (
    Array.from(payload).reduce(
      (sum, character) => sum + character.charCodeAt(0),
      0,
    ) % 256
  );
}

/** Exact boundaries retain the stage just completed for guided teaching. */
export function packetStageAt(time: number): PacketStageDefinition {
  return PACKET_STAGES.find((stage) => time <= stage.end) ?? PACKET_STAGES[7];
}

/**
 * Replaying or seeking rebuilds the same complete state from the teaching clock.
 * This is a packet/reliability illustration, not a simulation of an IP protocol.
 */
export function readPacketJourney(
  scenario: PacketScenario,
  time: number,
): PacketJourneySnapshot {
  const clock = Number.isFinite(time)
    ? Math.min(PACKET_DURATION, Math.max(0, time))
    : 0;
  const stage = packetStageAt(clock);
  const arrivals: (PacketArrival & { arrivedAt: number })[] = [];
  const packets = PAYLOADS.map((payload, index): JourneyPacket => {
    const number = index + 1;
    const affected = number === 3 && scenario !== 'clean';
    const departure = 6 + index * 0.5;
    const arrival = FIRST_ARRIVALS[index];
    const checkAt = FIRST_CHECKS[index];
    const firstProgress =
      clock < 9
        ? 0.2 * clamp((clock - departure) / 0.9)
        : 0.2 + 0.8 * clamp((clock - 9) / (arrival - 9));
    const faultReached = firstProgress >= 0.55;
    const missing = affected && scenario === 'missing' && faultReached;
    const corrupted = affected && scenario === 'damaged' && faultReached;
    const firstPayload = corrupted ? 'AT O' : payload;
    const firstChecked = clock >= checkAt && !missing;
    const firstValid =
      firstChecked && checksum(firstPayload) === checksum(payload);

    if (!missing && clock >= arrival) {
      arrivals.push({
        id: `${number}-1`,
        number,
        payload: firstPayload,
        attempt: 1,
        valid: firstChecked ? firstValid : null,
        arrivedAt: arrival,
      });
    }

    if (affected && clock >= RESEND_ARRIVAL) {
      arrivals.push({
        id: `${number}-2`,
        number,
        payload,
        attempt: 2,
        valid: clock >= RESEND_CHECK ? true : null,
        arrivedAt: RESEND_ARRIVAL,
      });
    }

    if (affected && clock >= RESEND_START) {
      const checked = clock >= RESEND_CHECK;
      return {
        number,
        payload,
        receivedPayload: payload,
        checksum: checksum(payload),
        receivedChecksum: checksum(payload),
        route: 'lower',
        progress: clamp(
          (clock - RESEND_START) / (RESEND_ARRIVAL - RESEND_START),
        ),
        status: checked
          ? 'valid'
          : clock >= RESEND_ARRIVAL
            ? 'arrived'
            : 'resending',
        attempt: 2,
        checked,
        corrupted: false,
      };
    }

    const status: PacketStatus = missing
      ? 'missing'
      : firstChecked
        ? firstValid
          ? 'valid'
          : 'damaged'
        : clock >= arrival
          ? 'arrived'
          : clock > departure
            ? 'travelling'
            : 'queued';
    return {
      number,
      payload,
      receivedPayload: firstPayload,
      checksum: checksum(payload),
      receivedChecksum: checksum(firstPayload),
      route: number % 2 === 1 ? 'upper' : 'lower',
      progress: missing ? 0.55 : firstProgress,
      status,
      attempt: 1,
      checked: firstChecked,
      corrupted,
    };
  });

  arrivals.sort((a, b) => a.arrivedAt - b.arrivedAt);
  // A numbered set prevents duplicate deliveries counting as extra packets.
  const receivedNumbers = [
    ...new Set(
      arrivals
        .filter((arrival) => arrival.valid === true)
        .map((arrival) => arrival.number),
    ),
  ].sort((a, b) => a - b);
  const allValid = receivedNumbers.length === PAYLOADS.length;
  return {
    scenario,
    time: clock,
    stage: stage.number,
    stageProgress: clamp((clock - stage.start) / (stage.end - stage.start)),
    completedStages: PACKET_STAGES.filter((entry) => entry.end <= clock).map(
      (entry) => entry.number,
    ),
    packets,
    arrivalOrder: arrivals.map((arrival) => arrival.number),
    arrivals: arrivals.map(({ id, number, payload, attempt, valid }) => ({
      id,
      number,
      payload,
      attempt,
      valid,
    })),
    receivedNumbers,
    requestProgress:
      scenario !== 'clean' && clock > REQUEST_START && clock < REQUEST_END
        ? clamp((clock - REQUEST_START) / (REQUEST_END - REQUEST_START))
        : null,
    timeoutProgress:
      scenario === 'missing' ? clamp((clock - 19.2) / (21 - 19.2)) : 0,
    allValid,
    reassembled:
      allValid && clock >= PACKET_DURATION
        ? packets.map((packet) => packet.payload).join('')
        : null,
    complete: clock >= PACKET_DURATION && allValid,
  };
}
