import { useMemo, useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import {
  ArrowRight,
  ArrowRightLeft,
  Cable,
  GitCompareArrows,
  Play,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudioLayout } from '../components/StudioLayout';
import {
  directionNames,
  PlaybackControls,
  TransmissionStage,
} from '../components/TransmissionStage';
import {
  buildTransmission,
  readTransmission,
  type DirectionMode,
  type SendIntent,
  type TransmissionConfig,
  type TransmissionMethod,
  type TransmissionView,
} from '../lib/transmission';
import { useTransmissionClock } from '../lib/useTransmissionClock';
import '../transmission.css';

const initialConfig: TransmissionConfig = {
  method: 'serial',
  mode: 'half-duplex',
  aBits: '10110010',
  bBits: '01001101',
  intent: 'both',
  distance: 'short',
  skew: false,
  crosstalk: false,
};
const directions: DirectionMode[] = ['simplex', 'half-duplex', 'full-duplex'];

function Choices<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="tx-choice" aria-label={label}>
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? 'default' : 'ghost'}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}

function ByteEditor({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="tx-byte-editor">
      <legend>Device {name} · outgoing byte</legend>
      <div>
        {value.split('').map((bit, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Device ${name} bit b${7 - index}: ${bit}. Flip bit`}
            aria-pressed={bit === '1'}
            onClick={() =>
              onChange(
                value.slice(0, index) +
                  (bit === '1' ? '0' : '1') +
                  value.slice(index + 1),
              )
            }
          >
            <small>b{7 - index}</small>
            <strong>{bit}</strong>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function MixExperiment({ active }: { active: boolean }) {
  const [config, setConfig] = useState(initialConfig);
  const plan = useMemo(() => buildTransmission(config), [config]);
  const clock = useTransmissionClock(plan.duration, active);
  function change(update: Partial<TransmissionConfig>) {
    clock.reset();
    setConfig((previous) => ({ ...previous, ...update }));
  }
  function send(intent: SendIntent) {
    setConfig((previous) => ({ ...previous, intent }));
    clock.play();
  }
  const state = readTransmission(plan, clock.time);
  return (
    <section className="tx-experiment" aria-label="Mix and send">
      <div className="tx-experiment-heading">
        <div>
          <span className="tx-eyebrow">01 / Make a connection</span>
          <h2>One bit or many. One way or both.</h2>
        </div>
        <span className="tx-combination-tag">2 methods × 3 modes</span>
      </div>
      <div className="tx-configuration">
        <Choices<TransmissionMethod>
          label="How bits travel"
          value={config.method}
          onChange={(method) => change({ method })}
          options={[
            { value: 'serial', label: 'Serial' },
            { value: 'parallel', label: 'Parallel' },
          ]}
        />
        <Choices<DirectionMode>
          label="Which way they travel"
          value={config.mode}
          onChange={(mode) =>
            change({
              mode,
              intent: mode === 'simplex' ? 'a-to-b' : config.intent,
            })
          }
          options={directions.map((mode) => ({
            value: mode,
            label: directionNames[mode],
          }))}
        />
      </div>
      <TransmissionStage
        plan={plan}
        time={clock.time}
        started={clock.started}
        title={`${config.method === 'serial' ? 'Serial' : 'Parallel'} + ${directionNames[config.mode]}`}
      />
      <PlaybackControls clock={clock}>
        <Button
          variant="accent"
          disabled={clock.busy}
          onClick={() => send('a-to-b')}
        >
          Send A <ArrowRight /> B
        </Button>
        <Button
          variant="outline"
          disabled={clock.busy || config.mode === 'simplex'}
          onClick={() => send('b-to-a')}
        >
          {config.mode === 'simplex' ? (
            'One-way link'
          ) : (
            <>
              Send B <ArrowRight /> A
            </>
          )}
        </Button>
        <Button
          variant="default"
          disabled={clock.busy || config.mode === 'simplex'}
          onClick={() => send('both')}
        >
          <ArrowRightLeft />
          Send both
        </Button>
      </PlaybackControls>
      <output className="tx-announcement">
        {!clock.started
          ? 'Choose a combination, then send a byte.'
          : state.directionLabel}
        {clock.complete
          ? ` · ${plan.sendSlots} sending ${plan.sendSlots === 1 ? 'slot' : 'slots'}.`
          : ''}
      </output>
      <details className="tx-payload-details">
        <summary>
          <SlidersHorizontal size={18} />
          Edit the two bytes <span>Tap a bit to flip it</span>
        </summary>
        <div className="tx-byte-editors">
          <ByteEditor
            name="A"
            value={config.aBits}
            onChange={(aBits) => change({ aBits })}
          />
          <ByteEditor
            name="B"
            value={config.bBits}
            onChange={(bBits) => change({ bBits })}
          />
        </div>
        <p>Changing a byte or transmission setting clears the receivers.</p>
      </details>
    </section>
  );
}

type Effects = Pick<TransmissionConfig, 'distance' | 'skew' | 'crosstalk'>;
type Evidence = 'speed' | 'distance' | 'skew' | 'crosstalk' | 'errors';
const evidenceSettings: Record<Evidence, Effects> = {
  speed: { distance: 'short', skew: false, crosstalk: false },
  distance: { distance: 'long', skew: true, crosstalk: true },
  skew: { distance: 'long', skew: true, crosstalk: false },
  crosstalk: { distance: 'long', skew: false, crosstalk: true },
  errors: { distance: 'long', skew: true, crosstalk: true },
};

function TradeoffTable({
  demonstrate,
}: {
  demonstrate: (evidence: Evidence) => void;
}) {
  const item = (text: string, evidence: Evidence) => (
    <button type="button" onClick={() => demonstrate(evidence)}>
      {text}
      <Play size={13} aria-hidden="true" />
    </button>
  );
  return (
    <section className="tx-tradeoffs" aria-labelledby="tx-tradeoffs-title">
      <div className="tx-section-heading">
        <h3 id="tx-tradeoffs-title">The trade-offs, in motion.</h3>
        <span>Tap a point to see it</span>
      </div>
      <div className="tx-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Method</th>
              <th scope="col">Advantages</th>
              <th scope="col">Limitations</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Serial</th>
              <td>
                {item('Suitable for longer distances', 'distance')}
                {item('No skew between parallel lanes', 'skew')}
                {item('Less multi-lane crosstalk', 'crosstalk')}
                {item('Lower associated error risk', 'errors')}
              </td>
              <td>
                {item('Fewer bits per tick at the same per-lane rate', 'speed')}
              </td>
            </tr>
            <tr>
              <th scope="row">Parallel</th>
              <td>
                {item('Several bits transmitted simultaneously', 'speed')}
              </td>
              <td>
                {item('Less suitable for long distances', 'distance')}
                {item('Timing skew', 'skew')}
                {item('Crosstalk / interference', 'crosstalk')}
                {item('Greater associated error risk', 'errors')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MethodExperiment({ active }: { active: boolean }) {
  const [effects, setEffects] = useState<Effects>(evidenceSettings.speed);
  const plans = useMemo(
    () =>
      (['serial', 'parallel'] as const).map((method) =>
        buildTransmission({
          ...initialConfig,
          ...effects,
          method,
          mode: 'simplex',
          intent: 'a-to-b',
        }),
      ),
    [effects],
  );
  const clock = useTransmissionClock(
    Math.max(...plans.map((plan) => plan.duration)),
    active,
  );
  function change(update: Partial<Effects>) {
    clock.reset();
    setEffects((previous) => ({ ...previous, ...update }));
  }
  function demonstrate(evidence: Evidence) {
    setEffects(evidenceSettings[evidence]);
    clock.play();
    document
      .getElementById('tx-method-stage')
      ?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
  return (
    <section className="tx-experiment" aria-label="Compare serial and parallel">
      <div className="tx-experiment-heading">
        <div>
          <span className="tx-eyebrow">
            02 / Keep the rate. Change the method.
          </span>
          <h2>Eight bits. Two different journeys.</h2>
        </div>
        <span className="tx-combination-tag">Same per-lane rate</span>
      </div>
      <div className="tx-configuration">
        <Choices
          label="Illustrative distance"
          value={effects.distance}
          onChange={(distance) => change({ distance })}
          options={[
            { value: 'short', label: 'Short distance' },
            { value: 'long', label: 'Long distance' },
          ]}
        />
        <fieldset
          className="tx-effect-switches"
          aria-label="Illustrative parallel-lane effects"
        >
          <label>
            <input
              type="checkbox"
              checked={effects.skew}
              onChange={(event) => change({ skew: event.target.checked })}
            />
            Show timing skew
          </label>
          <label>
            <input
              type="checkbox"
              checked={effects.crosstalk}
              onChange={(event) => change({ crosstalk: event.target.checked })}
            />
            Show crosstalk
          </label>
        </fieldset>
      </div>
      <div className="tx-method-boards" id="tx-method-stage">
        {plans.map((plan) => (
          <TransmissionStage
            key={plan.config.method}
            plan={plan}
            time={clock.time}
            started={clock.started}
            title={plan.config.method === 'serial' ? 'Serial' : 'Parallel'}
          />
        ))}
      </div>
      <PlaybackControls clock={clock}>
        <Button variant="accent" disabled={clock.busy} onClick={clock.play}>
          <Play />
          Send the same byte
        </Button>
      </PlaybackControls>
      <output className="tx-announcement">
        {effects.skew && effects.crosstalk
          ? 'Different arrival times. One illustrated bit flip.'
          : effects.skew
            ? 'Different arrival times — the bit positions never swap.'
            : effects.crosstalk
              ? 'An interference pulse flips b3 on the parallel link.'
              : 'At the same per-lane rate: 8 serial sending slots, 1 parallel sending slot.'}
      </output>
      <p className="tx-model-note">
        Teaching illustration · not a real distance limit or error probability.{' '}
        {effects.distance === 'long'
          ? 'Long distance amplifies enabled effects.'
          : 'Effects appear only when enabled.'}
      </p>
      <TradeoffTable demonstrate={demonstrate} />
    </section>
  );
}

const directionCopy: Record<
  DirectionMode,
  { analogy: string; advantage: string; limitation: string }
> = {
  simplex: {
    analogy: 'Like a broadcast',
    advantage: 'Straightforward one-way communication',
    limitation: 'No return communication on this link',
  },
  'half-duplex': {
    analogy: 'Like a walkie-talkie',
    advantage: 'Both devices can use the shared channel',
    limitation: 'One must wait while the other transmits',
  },
  'full-duplex': {
    analogy: 'Like a phone conversation',
    advantage: 'Both devices send and receive simultaneously',
    limitation: 'Requires support for simultaneous two-way operation',
  },
};

function DirectionExperiment({ active }: { active: boolean }) {
  const plans = useMemo(
    () =>
      directions.map((mode) => buildTransmission({ ...initialConfig, mode })),
    [],
  );
  const clock = useTransmissionClock(16, active);
  return (
    <section className="tx-experiment" aria-label="Compare direction modes">
      <div className="tx-experiment-heading">
        <div>
          <span className="tx-eyebrow">03 / Who gets to speak?</span>
          <h2>One way. Take turns. Talk together.</h2>
        </div>
        <span className="tx-combination-tag">Same serial method</span>
      </div>
      <PlaybackControls clock={clock}>
        <Button variant="accent" disabled={clock.busy} onClick={clock.play}>
          <Play />
          Both devices want to send
        </Button>
      </PlaybackControls>
      <div className="tx-direction-boards">
        {plans.map((plan) => {
          const copy = directionCopy[plan.config.mode];
          return (
            <article className="tx-direction-card" key={plan.config.mode}>
              <TransmissionStage
                plan={plan}
                time={clock.time}
                started={clock.started}
                title={directionNames[plan.config.mode]}
                compact
              />
              <div className="tx-direction-copy">
                <span className="tx-analogy">
                  <Radio size={16} />
                  {copy.analogy}
                </span>
                <p>
                  <span className="tx-pro-label">Advantage</span>
                  {copy.advantage}
                </p>
                <p>
                  <span className="tx-con-label">Limitation</span>
                  {copy.limitation}
                </p>
              </div>
            </article>
          );
        })}
      </div>
      <output className="tx-announcement">
        {!clock.started
          ? 'Both devices have a byte ready. Watch who must wait.'
          : clock.complete
            ? 'Simplex: no reply. Half-duplex: a reply after waiting. Full-duplex: both at once.'
            : 'Simplex cannot return data; half-duplex takes turns; full-duplex sends both ways at once.'}
      </output>
    </section>
  );
}

function TransmissionNotes() {
  return (
    <div className="tx-notes">
      <section>
        <h3>Two independent choices</h3>
        <p>
          Serial sends bits one after another on one logical data lane. Parallel
          sends several bits simultaneously on separate lanes. Simplex,
          half-duplex and full-duplex describe direction, not the number of
          lanes. All six combinations are possible.
        </p>
      </section>
      <section>
        <h3>A fair speed comparison</h3>
        <p>
          The model gives each lane the same rate. One byte uses 8 serial
          sending slots or 1 parallel slot. Two opposite-direction bytes use 16
          / 2 slots with half-duplex or 8 / 1 with full-duplex. It omits
          protocol overhead, turn-around time and real propagation delay. The
          playback speed is only an animation control. Modern serial connections
          can outperform parallel connections.
        </p>
      </section>
      <section>
        <h3>Skew is not reordering</h3>
        <p>
          Skew means bits travelling on different lanes arrive at different
          times. The lane and bit position stay fixed. A receiver may have to
          wait; sampling too soon can cause errors. This illustration waits for
          late bits. Crosstalk is a separate effect that deliberately flips b3,
          making an error visible.
        </p>
      </section>
      <section>
        <h3>Distance and reliability</h3>
        <p>
          Short and long are qualitative teaching conditions, not real cable
          specifications. Longer links make parallel timing and interference
          harder to manage. The toggles illustrate possible problems, not
          guaranteed failures or measured probabilities. Serial avoids skew
          between parallel lanes but is not immune to noise, interference or
          errors.
        </p>
      </section>
      <section>
        <h3>Full-duplex ≠ twice every speed</h3>
        <p>
          Full-duplex permits simultaneous sending and receiving. It does not
          necessarily make a one-way transfer faster. The two drawn directions
          are logical paths, not a claim that every full-duplex device needs
          twice as many physical wires. Hardware must support simultaneous
          two-way operation.
        </p>
      </section>
      <section>
        <h3>Classroom controls</h3>
        <p>
          Pause freezes the model. Step advances one teaching tick, including
          from idle. Replay repeats the last send. Changing data or settings
          clears the receivers. Switching experiments or hiding the browser
          pauses playback. In reduced-motion mode, the clock advances in
          discrete steps. The everyday analogies describe direction only.
        </p>
      </section>
    </div>
  );
}

export function TransmissionLabPage() {
  const [view, setView] = useState<TransmissionView>('mix');
  return (
    <StudioLayout
      title="Transmission Lab"
      kind="transmission"
      sectionId="2.1"
      showSettings={false}
      collapseReference
      referenceTitle="Teacher notes · transmission models & trade-offs"
      reference={<TransmissionNotes />}
    >
      <Tabs.Root
        className="tx-lab"
        value={view}
        onValueChange={(value) => setView(value as TransmissionView)}
      >
        <Tabs.List className="tx-tabs" aria-label="Transmission experiments">
          <Tabs.Tab value="mix">
            <Cable />
            Mix & send
          </Tabs.Tab>
          <Tabs.Tab value="methods">
            <GitCompareArrows />
            Serial vs parallel
          </Tabs.Tab>
          <Tabs.Tab value="directions">
            <ArrowRightLeft />
            Direction modes
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="mix" keepMounted>
          <MixExperiment active={view === 'mix'} />
        </Tabs.Panel>
        <Tabs.Panel value="methods" keepMounted>
          <MethodExperiment active={view === 'methods'} />
        </Tabs.Panel>
        <Tabs.Panel value="directions" keepMounted>
          <DirectionExperiment active={view === 'directions'} />
        </Tabs.Panel>
      </Tabs.Root>
    </StudioLayout>
  );
}
