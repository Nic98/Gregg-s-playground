import { useEffect, useRef, useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import {
  ArrowDownToLine,
  ArrowRight,
  Clock3,
  File,
  HardDrive,
  Pause,
  Play,
  RotateCcw,
  Wifi,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { StudioLayout } from '../components/StudioLayout';
import { qualityLabRoute } from '../data/syllabus';
import {
  examplePair,
  formatBitrate,
  formatBytes,
  formatSeconds,
  number,
  qualityLabels,
  readFilePair,
  type FilePair,
} from '../lib/qualityLab';
import '../effects.css';

type Scene = 'download' | 'deadline' | 'storage';
const scenes = [
  { id: 'download' as const, label: 'Download race', icon: ArrowDownToLine },
  { id: 'deadline' as const, label: 'Same deadline', icon: Wifi },
  { id: 'storage' as const, label: 'Storage shelf', icon: HardDrive },
];

function RangeControl({
  label,
  value,
  min,
  max,
  display,
  start,
  end,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  display: string;
  start: string;
  end: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="effect-slider-group">
      <div className="effect-slider-heading">
        <span>{label}</span>
        <output>{display}</output>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        aria-label={label}
        aria-valuetext={display}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
      />
      <div className="effect-slider-ends">
        <span>{start}</span>
        <span>{end}</span>
      </div>
    </div>
  );
}

function DownloadRace({
  pair,
  bandwidth,
}: {
  pair: FilePair;
  bandwidth: number;
}) {
  const sizes = [pair.beforeBytes, pair.afterBytes];
  const durations = sizes.map((bytes) => (bytes * 8) / (bandwidth * 1e6));
  const longest = Math.max(...durations);
  // A shared clock preserves the exact finish-time ratio, even for a 32-byte image.
  const secondsPerTick = longest < 1 || longest > 12 ? longest / 6 : 1;
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const [running, setRunning] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!running) return;
    let last: number | null = null;
    let frame = 0;
    const tick = (now: number) => {
      // Pause the simulated clock while the tab is hidden.
      const delta =
        last === null || document.hidden ? 0 : Math.min(100, now - last);
      last = now;
      const next = reduced
        ? longest
        : Math.min(
            longest,
            elapsedRef.current + (delta / 1000) * secondsPerTick,
          );
      elapsedRef.current = next;
      setElapsed(next);
      if (next >= longest) setRunning(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, longest, secondsPerTick, reduced]);
  const complete = elapsed >= longest;
  function replay() {
    elapsedRef.current = 0;
    setElapsed(0);
    setRunning(true);
  }
  return (
    <>
      <div className="file-scene-heading">
        <div>
          <span className="effect-kicker">One connection speed</span>
          <h2>Which file arrives first?</h2>
        </div>
        <span className="effect-fixed-value">
          <Wifi />
          {bandwidth} Mbps each
        </span>
      </div>
      <div className="file-race-grid">
        {sizes.map((bytes, index) => {
          const progress = Math.min(1, elapsed / durations[index]);
          return (
            <section
              key={index}
              className={`file-race-lane ${index ? 'file-version--after' : ''}`}
              aria-label={`${index ? 'After' : 'Before'} download`}
            >
              <div className="studio-row">
                <span className="effect-kicker">
                  {index ? 'B · After' : 'A · Before'}
                </span>
                <span className="effect-muted">{formatBytes(bytes)}</span>
              </div>
              <div className="file-arrival">
                <strong>{formatSeconds(durations[index])}</strong>
                <span>to arrive</span>
              </div>
              <div className="file-transfer-visual" aria-hidden="true">
                <File />
                <div className="file-transfer-line">
                  <span style={{ width: `${progress * 100}%` }} />
                </div>
                <ArrowDownToLine />
              </div>
              <progress
                className="file-progress"
                aria-label={`${index ? 'After' : 'Before'} transferred`}
                max={1}
                value={progress}
              >
                {Math.round(progress * 100)}%
              </progress>
              <div className="studio-row file-progress-readout">
                <strong>{Math.floor(progress * 100)}%</strong>
                <span>
                  {progress >= 1
                    ? 'Arrived'
                    : `${formatBytes(bytes * progress)} transferred`}
                </span>
              </div>
            </section>
          );
        })}
      </div>
      <div className="file-playback-bar">
        <div className="effect-actions">
          <Button
            size="lg"
            variant="accent"
            onClick={() =>
              running
                ? setRunning(false)
                : complete
                  ? replay()
                  : setRunning(true)
            }
          >
            {running ? <Pause /> : <Play />}
            {running
              ? 'Pause'
              : complete
                ? 'Replay'
                : elapsed > 0
                  ? 'Resume'
                  : reduced
                    ? 'Show result'
                    : 'Start'}
          </Button>
          <Button size="lg" variant="outline" onClick={replay}>
            <RotateCcw />
            Replay
          </Button>
        </div>
        <div className="file-clock">
          <Clock3 />
          <strong>{formatSeconds(elapsed)}</strong>
          <span>
            {secondsPerTick === 1
              ? 'Real-time simulation'
              : `Scaled clock · 1 screen second = ${formatSeconds(secondsPerTick)}`}
          </span>
        </div>
      </div>
      <output className="sr-only">
        {complete
          ? 'Both files have arrived.'
          : running
            ? 'Transmission running.'
            : 'Transmission paused or ready.'}
      </output>
    </>
  );
}

function DeadlineScene({ pair, seconds }: { pair: FilePair; seconds: number }) {
  const rates = [pair.beforeBytes, pair.afterBytes].map(
    (bytes) => (bytes * 8) / seconds,
  );
  const pipeMaximum = Math.max(pair.beforeBytes, pair.afterBytes) * 8;
  return (
    <>
      <div className="file-scene-heading">
        <div>
          <span className="effect-kicker">One shared deadline</span>
          <h2>Make both arrive on time.</h2>
        </div>
        <span className="effect-fixed-value">
          <Clock3 />
          {seconds} seconds each
        </span>
      </div>
      <div className="file-bandwidth-grid">
        {rates.map((rate, index) => (
          <section
            key={index}
            className={`file-pipe-card ${index ? 'file-version--after' : ''}`}
          >
            <span className="effect-kicker">
              {index ? 'B · After' : 'A · Before'}
            </span>
            <div className="file-arrival">
              <strong>{formatBitrate(rate)}</strong>
              <span>required bandwidth</span>
            </div>
            <div
              className="file-pipe-stage"
              aria-label={`Required bandwidth: ${formatBitrate(rate)}`}
            >
              <File aria-hidden="true" />
              <div className="file-pipe-boundary">
                <div
                  className="file-pipe"
                  style={{ height: `${(rate / pipeMaximum) * 100}%` }}
                />
              </div>
              <ArrowDownToLine aria-hidden="true" />
            </div>
            <div className="studio-row">
              <span>
                {formatBytes(index ? pair.afterBytes : pair.beforeBytes)}
              </span>
              <strong>Arrives in {seconds} s</strong>
            </div>
            <span className="file-pipe-scale">
              Full pipe = {formatBitrate(pipeMaximum)}
            </span>
          </section>
        ))}
      </div>
    </>
  );
}

function StorageScene({
  pair,
  capacity,
  filled,
  onFill,
}: {
  pair: FilePair;
  capacity: number;
  filled: boolean;
  onFill: () => void;
}) {
  return (
    <>
      <div className="file-scene-heading">
        <div>
          <span className="effect-kicker">One storage capacity</span>
          <h2>How many can you keep?</h2>
        </div>
        <span className="effect-fixed-value">
          <HardDrive />
          {formatBytes(capacity)} each
        </span>
      </div>
      <div className="file-storage-grid">
        {[pair.beforeBytes, pair.afterBytes].map((bytes, index) => {
          const fits = Math.floor(capacity / bytes);
          const stored = filled ? fits : Math.min(1, fits);
          const used = stored * bytes;
          // At most 64 separators; large collections remain proportional without creating thousands of nodes.
          const step = Math.max(1, Math.ceil(stored / 64));
          return (
            <section
              key={index}
              className={`file-storage-card ${index ? 'file-version--after' : ''}`}
            >
              <div className="studio-row">
                <span className="effect-kicker">
                  {index ? 'B · After' : 'A · Before'}
                </span>
                <span className="effect-muted">
                  {formatBytes(bytes)} / file
                </span>
              </div>
              <div className="file-arrival">
                <strong>{number(fits)}</strong>
                <span>files that fit</span>
              </div>
              <figure
                className="file-storage-tank"
                aria-label={`${stored} files stored. ${number(used)} of ${number(capacity)} bytes used.`}
              >
                <div
                  className="file-storage-fill"
                  style={{ width: `${(used / capacity) * 100}%` }}
                />
                {Array.from(
                  { length: Math.min(64, Math.ceil(stored / step)) },
                  (_, i) => i * step,
                )
                  .filter((i) => i > 0)
                  .map((i) => (
                    <span
                      className="file-storage-divider"
                      key={i}
                      style={{ left: `${((i * bytes) / capacity) * 100}%` }}
                    />
                  ))}
                <div className="file-storage-label">
                  <span>
                    <HardDrive />
                    {number(stored)} {stored === 1 ? 'file' : 'files'} stored
                  </span>
                </div>
              </figure>
              <div className="studio-row file-storage-readout">
                <span>{formatBytes(used)} used</span>
                <strong>{formatBytes(capacity - used)} free</strong>
              </div>
            </section>
          );
        })}
      </div>
      <div className="file-playback-bar">
        <Button size="lg" variant="accent" onClick={onFill}>
          <HardDrive />
          {filled ? 'Show one file' : 'Fill storage'}
        </Button>
        <span className="effect-muted">
          Whole files only · Equal-size containers
        </span>
      </div>
    </>
  );
}

function FileSizeWorkspace({
  initialPair,
  clearImport,
}: {
  initialPair: FilePair;
  clearImport: () => void;
}) {
  const [pair, setPair] = useState(initialPair);
  const [scene, setScene] = useState<Scene>('download');
  const [bandwidth, setBandwidth] = useState(10);
  const [deadline, setDeadline] = useState(5);
  const [capacityFactor, setCapacityFactor] = useState(4);
  const [filled, setFilled] = useState(false);
  const largest = Math.max(pair.beforeBytes, pair.afterBytes);
  const capacity = capacityFactor * largest;
  function chooseExample(bytes: number) {
    setPair({ ...examplePair, afterBytes: bytes });
    setBandwidth(10);
    setDeadline(5);
    setCapacityFactor(4);
    setFilled(false);
  }
  return (
    <div className="effect-lab">
      <div className="file-pair-strip">
        {[pair.beforeBytes, pair.afterBytes].map((bytes, index) => (
          <div
            key={index}
            className={`file-pair-token ${index ? 'file-pair-token--after' : ''}`}
          >
            <File aria-hidden="true" />
            <div>
              <span className="effect-kicker">
                {index ? 'B · After' : 'A · Before'}
              </span>
              <strong>{formatBytes(bytes)}</strong>
              <span>{number(bytes)} bytes</span>
            </div>
          </div>
        ))}
        <span className="effect-multiplier">
          ×{number(pair.afterBytes / pair.beforeBytes)}
        </span>
        <div className="file-pair-options">
          {pair.source === 'example' ? (
            <>
              <span className="effect-kicker">Change file B</span>
              <fieldset className="effect-actions" aria-label="After file size">
                {[2, 4, 8, 16].map((mb) => (
                  <Button
                    key={mb}
                    variant={
                      pair.afterBytes === mb * 1e6 ? 'accent' : 'outline'
                    }
                    aria-pressed={pair.afterBytes === mb * 1e6}
                    onClick={() => chooseExample(mb * 1e6)}
                  >
                    {mb} MB
                  </Button>
                ))}
              </fieldset>
            </>
          ) : (
            <>
              <span className="effect-kicker">From Quality Lab</span>
              <strong>{qualityLabels[pair.source]}</strong>
              <Button variant="outline" onClick={clearImport}>
                Use example files
              </Button>
            </>
          )}
        </div>
      </div>
      <Tabs.Root
        value={scene}
        onValueChange={(value) => setScene(value as Scene)}
      >
        <Tabs.List
          className="effect-tabs file-tabs"
          aria-label="File size effects"
        >
          {scenes.map(({ id, label, icon: Icon }) => (
            <Tabs.Tab key={id} value={id}>
              <Icon size={18} />
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel value={scene} key={scene} className="file-scene">
          {scene === 'download' ? (
            <DownloadRace
              key={`${pair.beforeBytes}:${pair.afterBytes}:${bandwidth}`}
              pair={pair}
              bandwidth={bandwidth}
            />
          ) : scene === 'deadline' ? (
            <DeadlineScene pair={pair} seconds={deadline} />
          ) : (
            <StorageScene
              pair={pair}
              capacity={capacity}
              filled={filled}
              onFill={() => setFilled((value) => !value)}
            />
          )}
          <div className="effect-control-bar file-control-bar">
            {scene === 'download' ? (
              <RangeControl
                label="Bandwidth for each file"
                value={bandwidth}
                min={1}
                max={100}
                display={`${bandwidth} Mbps`}
                start="1 Mbps"
                end="100 Mbps"
                onChange={setBandwidth}
              />
            ) : scene === 'deadline' ? (
              <RangeControl
                label="Target transfer time"
                value={deadline}
                min={1}
                max={10}
                display={`${deadline} seconds`}
                start="1 second"
                end="10 seconds"
                onChange={setDeadline}
              />
            ) : (
              <RangeControl
                label="Storage capacity for each container"
                value={capacityFactor}
                min={1}
                max={8}
                display={formatBytes(capacity)}
                start={formatBytes(largest)}
                end={formatBytes(largest * 8)}
                onChange={setCapacityFactor}
              />
            )}
            <p className="file-conclusion">
              {scene === 'download'
                ? 'Same bandwidth. A larger file takes longer.'
                : scene === 'deadline'
                  ? 'Same transfer time. A larger file needs more bandwidth.'
                  : 'Same storage. Fewer large files fit.'}
            </p>
          </div>
        </Tabs.Panel>
      </Tabs.Root>
      <footer className="file-lab-footer">
        <span>Simulation only · No real downloads</span>
        <Link
          className={buttonVariants({ variant: 'ghost' })}
          to={qualityLabRoute}
        >
          Explore quality <ArrowRight />
        </Link>
      </footer>
    </div>
  );
}

export function FileSizeLabPage() {
  const [params, setParams] = useSearchParams();
  const pair = readFilePair(params);
  return (
    <StudioLayout
      title="File Size Lab"
      kind="files"
      showSettings={false}
      collapseReference
      referenceTitle="Teacher notes"
      reference={
        <div className="effect-teacher-notes">
          <p>
            <strong>Transfer time:</strong> bytes × 8 ÷ bits per second =
            seconds. Both files get the displayed bandwidth independently; they
            do not compete for one shared connection. These ideal times exclude
            network overhead, latency and congestion.
          </p>
          <p>
            <strong>Required bandwidth:</strong> bytes × 8 ÷ target seconds =
            bits per second. A larger file does not inherently require a faster
            connection: it needs more time at the same rate, or a higher rate to
            meet the same deadline.
          </p>
          <p>
            <strong>Storage:</strong> whole files that fit = floor(capacity ÷
            file bytes). Containers share one capacity. The filled view stores
            only complete files and shows any unused remainder. Very large
            collections group their visual separators.
          </p>
          <p>
            <strong>Units:</strong> 1 byte = 8 bits; 1 kB = 1,000 bytes; 1 MB =
            1,000,000 bytes; 1 Mbps = 1,000,000 bits/second. Quality Lab passes
            exact raw-data sizes, not compressed file sizes. When the animation
            clock is scaled, both tracks use the same factor and displayed times
            remain real theoretical times.
          </p>
        </div>
      }
    >
      <FileSizeWorkspace
        key={`${pair.source}:${pair.beforeBytes}:${pair.afterBytes}`}
        initialPair={pair}
        clearImport={() => setParams({})}
      />
    </StudioLayout>
  );
}
