import { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudioLayout } from '../components/StudioLayout';
import { PacketNetworkStage } from '../components/PacketNetworkStage';
import {
  PACKET_MESSAGE,
  PACKET_SOURCE_IP,
  PACKET_DESTINATION_IP,
  PACKET_STAGES,
  readPacketJourney,
  type PacketScenario,
} from '../lib/packetSwitching';
import { usePacketClock } from '../lib/usePacketClock';
import '../packet-switching.css';

type Snapshot = ReturnType<typeof readPacketJourney>;
const checksumLabel = (value: number) =>
  value.toString(16).toUpperCase().padStart(2, '0');
const revealed = (snapshot: Snapshot, step: number, number: number) =>
  snapshot.stage > step ||
  (snapshot.stage === step && snapshot.stageProgress > (number - 1) / 4);

function PacketAssembly({
  snapshot,
  selectedPacket,
  onSelectPacket,
}: {
  snapshot: Snapshot;
  selectedPacket: number;
  onSelectPacket: (number: number) => void;
}) {
  return (
    <section
      className="pk-assembly"
      aria-label="Prepare the message at the sender"
    >
      <div className="pk-envelope">
        <Mail size={28} aria-hidden="true" />
        <div>
          <span className="pk-eyebrow">At the sender</span>
          <p>{PACKET_MESSAGE}</p>
        </div>
        <span className="pk-message-count">16 characters</span>
      </div>
      <div className="pk-split-connector" aria-hidden="true">
        <span />
        <ArrowRight />
      </div>
      <div className="pk-payloads">
        {snapshot.packets.map((packet) => (
          <button
            key={packet.number}
            type="button"
            className={`pk-payload-card ${selectedPacket === packet.number ? 'is-selected' : ''} ${revealed(snapshot, 1, packet.number) ? 'is-revealed' : 'is-waiting'}`}
            aria-label={`Inspect packet ${packet.number}`}
            aria-pressed={selectedPacket === packet.number}
            onClick={() => onSelectPacket(packet.number)}
          >
            <span className="pk-card-number">Packet {packet.number}</span>
            <span
              className={`pk-mini-header ${revealed(snapshot, 2, packet.number) ? 'is-visible' : ''}`}
            >
              Header <span>#{packet.number} · From → To</span>
            </span>
            <code className="pk-mini-payload">
              {revealed(snapshot, 1, packet.number) ? packet.payload : '····'}
            </code>
            <span
              className={`pk-mini-trailer ${revealed(snapshot, 3, packet.number) ? 'is-visible' : ''}`}
            >
              Trailer <code>{checksumLabel(packet.checksum)}</code>
            </span>
          </button>
        ))}
      </div>
      <div className="pk-assembly-footer">
        <span>One message → four packets</span>
        <span>Simplified packet model</span>
      </div>
    </section>
  );
}

function PacketInspector({
  snapshot,
  selectedPacket,
  onSelectPacket,
}: {
  snapshot: Snapshot;
  selectedPacket: number;
  onSelectPacket: (number: number) => void;
}) {
  const packet = snapshot.packets.find(
    (entry) => entry.number === selectedPacket,
  )!;
  const headers = revealed(snapshot, 2, packet.number);
  const trailers = revealed(snapshot, 3, packet.number);
  const damaged = packet.checked && packet.receivedPayload !== packet.payload;
  return (
    <aside className="pk-inspector" aria-label="Packet details">
      <div className="pk-inspector-heading">
        <h2>Inside a packet</h2>
        <span>#{packet.number}</span>
      </div>
      <fieldset className="pk-packet-picker" aria-label="Select a packet">
        {snapshot.packets.map((entry) => (
          <button
            key={entry.number}
            type="button"
            aria-label={`View packet ${entry.number}`}
            aria-pressed={selectedPacket === entry.number}
            onClick={() => onSelectPacket(entry.number)}
          >
            {entry.number}
          </button>
        ))}
      </fieldset>
      <section
        className={`pk-anatomy pk-anatomy--header ${headers ? '' : 'is-pending'}`}
      >
        <h3>
          <span>01</span> Header
        </h3>
        {headers ? (
          <dl>
            <div>
              <dt>Source IP</dt>
              <dd>{PACKET_SOURCE_IP}</dd>
            </div>
            <div>
              <dt>Destination IP</dt>
              <dd>{PACKET_DESTINATION_IP}</dd>
            </div>
            <div>
              <dt>Packet number</dt>
              <dd>
                {packet.number} <span>of 4</span>
              </dd>
            </div>
          </dl>
        ) : (
          <p>Added in step 2</p>
        )}
      </section>
      <section className="pk-anatomy pk-anatomy--payload">
        <h3>
          <span>02</span> Payload
        </h3>
        <code className="pk-payload-text">
          {revealed(snapshot, 1, packet.number) ? packet.payload : '····'}
        </code>
        {damaged && (
          <p className="pk-error">
            Received: <code>{packet.receivedPayload}</code>{' '}
            <X size={14} aria-hidden="true" />
          </p>
        )}
      </section>
      <section
        className={`pk-anatomy pk-anatomy--trailer ${trailers ? '' : 'is-pending'}`}
      >
        <h3>
          <span>03</span> Trailer
        </h3>
        {trailers ? (
          <>
            <dl>
              <div>
                <dt>Sent checksum</dt>
                <dd>{checksumLabel(packet.checksum)}</dd>
              </div>
              {packet.checked && (
                <div>
                  <dt>Calculated on receipt</dt>
                  <dd className={damaged ? 'pk-error' : ''}>
                    {checksumLabel(packet.receivedChecksum)}{' '}
                    {damaged ? <X size={14} /> : <Check size={14} />}
                  </dd>
                </div>
              )}
            </dl>
            <p>8-bit checksum · shown in hex</p>
          </>
        ) : (
          <p>Added in step 3</p>
        )}
      </section>
      <span className="pk-inspector-footnote">
        Simplified packet model · spaces preserved
      </span>
    </aside>
  );
}

function ReceiverTray({ snapshot }: { snapshot: Snapshot }) {
  return (
    <section className="pk-receiver" aria-label="Receiver results">
      <div className="pk-receiver-line">
        <span>Arrival order</span>
        <div className="pk-arrivals">
          {snapshot.arrivals.length ? (
            snapshot.arrivals.map((arrival) => (
              <span
                key={arrival.id}
                className={`pk-arrival ${arrival.valid === false ? 'is-rejected' : ''}`}
                aria-label={`Packet ${arrival.number}, ${arrival.attempt === 2 ? 'resent, ' : ''}${arrival.valid === false ? 'rejected' : arrival.valid === true ? 'valid' : 'awaiting check'}`}
              >
                #{arrival.number}
                {arrival.valid === false ? (
                  <X size={14} />
                ) : arrival.attempt === 2 ? (
                  <RotateCcw size={12} />
                ) : (
                  <ArrowRight size={12} />
                )}
              </span>
            ))
          ) : (
            <span className="pk-empty">Waiting for packets</span>
          )}
        </div>
      </div>
      <div className="pk-receiver-line">
        <span>Reassembled order</span>
        <div className="pk-reassembly">
          {snapshot.packets.map((packet) => (
            <div
              key={packet.number}
              className={
                snapshot.receivedNumbers.includes(packet.number)
                  ? 'is-valid'
                  : ''
              }
            >
              <small>#{packet.number}</small>
              <code>
                {snapshot.reassembled ||
                (snapshot.allValid &&
                  snapshot.stage === 8 &&
                  snapshot.stageProgress >= packet.number / 4) ? (
                  packet.payload
                ) : snapshot.receivedNumbers.includes(packet.number) ? (
                  <Check size={17} aria-label="Valid packet held" />
                ) : (
                  '—'
                )}
              </code>
            </div>
          ))}
        </div>
      </div>
      {snapshot.scenario === 'missing' && snapshot.stage === 6 && (
        <div className="pk-timeout">
          <span>
            {snapshot.timeoutProgress === 1
              ? 'Timeout reached · packet 3 is missing'
              : 'Illustrative timeout · waiting for packet 3'}
          </span>
          <progress
            max={1}
            value={snapshot.timeoutProgress}
            aria-label="Illustrative missing-packet timeout"
          />
        </div>
      )}
      <div
        className={`pk-delivery ${snapshot.reassembled ? 'is-complete' : ''}`}
      >
        <ShieldCheck size={16} aria-hidden="true" />
        {snapshot.reassembled ? (
          <>
            <strong>Message restored</strong>
            <code>{snapshot.reassembled}</code>
          </>
        ) : (
          <span>
            {snapshot.receivedNumbers.length} / 4 valid packets
            {snapshot.allValid
              ? ' · Ready to reassemble'
              : ' · Reassembly waits for every valid packet'}
          </span>
        )}
      </div>
    </section>
  );
}

function TeacherNotes() {
  return (
    <div className="pk-notes">
      <article>
        <h2>A school-level packet model</h2>
        <p>
          The sender divides and packages the message; routers forward packets;
          the receiver checks and reconstructs it. The header contains the
          originator’s address, destination address and packet number. Real
          protocol layouts vary: not every IP packet has this trailer or
          numbering scheme.
        </p>
      </article>
      <article>
        <h2>Routes & arrival order</h2>
        <p>
          Packets can take different available routes, but do not have to.
          Routers choose suitable next hops, not necessarily the geographically
          shortest path. Here, fixed illustrative timings produce the arrival
          order 2, 1, 4, 3. Animation speed is not a real network rate.
        </p>
      </article>
      <article>
        <h2>Detection is not correction</h2>
        <p>
          This simple checksum adds the payload’s ASCII byte values and takes
          the result modulo 256. It is not CRC and cannot detect every possible
          error. Only packet 3 is damaged or lost, and only on its first
          attempt. A damaged payload is rejected, not silently repaired.
        </p>
        <code>checksum = sum of payload bytes mod 256</code>
      </article>
      <article>
        <h2>Reliable delivery · connection to 2.2</h2>
        <p>
          The return request and retransmission illustrate a reliable-delivery
          mechanism layered on packet switching; packet switching alone does not
          guarantee delivery or recovery. Missing data is requested after an
          illustrative timeout. Previously validated packets are retained.
        </p>
      </article>
    </div>
  );
}

export function PacketSwitchingLabPage() {
  const [scenario, setScenario] = useState<PacketScenario>('damaged');
  const [selectedPacket, setSelectedPacket] = useState(3);
  const clock = usePacketClock();
  const snapshot = readPacketJourney(scenario, clock.time);
  const stage = PACKET_STAGES[snapshot.stage - 1];
  const explanation =
    snapshot.stage === 7 && scenario === 'clean'
      ? 'All packets received — no resend needed.'
      : stage.description;
  return (
    <StudioLayout
      title="Packet Switching Lab"
      kind="packet-switching"
      sectionId="2.1"
      showSettings={false}
      collapseReference
      referenceTitle="Teacher notes"
      reference={<TeacherNotes />}
    >
      <div className="pk-lab">
        <ol className="pk-steps" aria-label="Eight-step journey">
          {PACKET_STAGES.map((entry) => (
            <li
              key={entry.number}
              aria-current={
                snapshot.stage === entry.number ? 'step' : undefined
              }
              className={
                snapshot.completedStages.includes(entry.number) ? 'is-done' : ''
              }
            >
              <span>
                {snapshot.completedStages.includes(entry.number) ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  entry.number
                )}
              </span>
              <strong>{entry.label}</strong>
            </li>
          ))}
        </ol>
        <div className="pk-heading">
          <div>
            <span className="pk-eyebrow">
              Step {snapshot.stage} / 8 · A message in motion
            </span>
            <h2>{explanation}</h2>
          </div>
          <label className="pk-scenario">
            Delivery scenario
            <select
              value={scenario}
              onChange={(event) => {
                clock.reset();
                setScenario(event.target.value as PacketScenario);
              }}
            >
              <option value="damaged">One damaged packet</option>
              <option value="missing">One missing packet</option>
              <option value="clean">Clean delivery</option>
            </select>
          </label>
        </div>
        <fieldset className="pk-controls" aria-label="Journey playback">
          <Button
            variant="accent"
            onClick={clock.next}
            disabled={clock.running || clock.complete}
          >
            Next step <ChevronRight />
          </Button>
          <Button
            variant="default"
            onClick={clock.playAll}
            disabled={clock.running}
          >
            <Play /> Play all
          </Button>
          <Button
            variant="outline"
            onClick={clock.toggle}
            disabled={!clock.started || clock.complete}
          >
            {clock.running ? <Pause /> : <Play />}
            {clock.running ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            onClick={clock.previous}
            disabled={clock.time === 0}
          >
            <ChevronLeft /> Previous step
          </Button>
          <Button variant="ghost" onClick={clock.replay}>
            <RotateCcw /> Replay
          </Button>
          <label className="pk-speed">
            Speed
            <select
              value={clock.speed}
              onChange={(event) => clock.setSpeed(Number(event.target.value))}
            >
              <option value={0.5}>0.5×</option>
              <option value={1}>1×</option>
              <option value={2}>2×</option>
            </select>
          </label>
          <output className="pk-play-status">
            {clock.complete
              ? 'Journey complete'
              : clock.running
                ? 'Playing'
                : clock.time > 0
                  ? 'Paused · ready to explore'
                  : 'Ready when you are'}
          </output>
        </fieldset>
        <div className="pk-workspace">
          <div className="pk-main-stage">
            {snapshot.stage <= 3 ? (
              <PacketAssembly
                snapshot={snapshot}
                selectedPacket={selectedPacket}
                onSelectPacket={setSelectedPacket}
              />
            ) : (
              <PacketNetworkStage
                snapshot={snapshot}
                selectedPacket={selectedPacket}
                onSelectPacket={setSelectedPacket}
              />
            )}
            <ReceiverTray snapshot={snapshot} />
          </div>
          <PacketInspector
            snapshot={snapshot}
            selectedPacket={selectedPacket}
            onSelectPacket={setSelectedPacket}
          />
        </div>
      </div>
    </StudioLayout>
  );
}
