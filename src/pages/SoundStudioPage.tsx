import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  AudioLines,
  Ear,
  Mic,
  Play,
  Shuffle,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudioLayout, Walkthrough } from '../components/StudioLayout';
import { SoundScope } from '../components/SoundScope';
import { binary } from '../lib/textEncoding';
import {
  listeningExperiments,
  makeSound,
  processSound,
  soundPresets,
  SOURCE_RATE,
  type ListeningExperiment,
  type SoundPreset,
} from '../lib/soundMath';
import { useStudioAudio } from '../lib/useStudioAudio';

const lessons = [
  {
    title: 'Catch a sound wave.',
    text: 'A microphone converts variations in air pressure into an analogue electrical signal. An ADC converts this signal into digital data.',
  },
  {
    title: 'Measure at regular intervals.',
    text: 'Sample rate is the number of samples taken per second, measured in hertz (Hz). Increase it to take more measurements in the same time.',
  },
  {
    title: 'Give each amplitude a code.',
    text: 'Sample resolution is the number of bits per sample. With b bits, up to 2ᵇ amplitude levels can be represented. Each measurement is rounded to an available level.',
  },
  {
    title: 'Join the sample codes.',
    text: 'Write the codes in time order to form a binary sequence. More samples or more bits per sample increase the raw data size for the same duration.',
  },
];
const number = (value: number) => value.toLocaleString('en-GB');
const randomOrder = () =>
  crypto.getRandomValues(new Uint8Array(1))[0] % 2 === 0;

export function SoundStudioPage() {
  const [preset, setPreset] = useState<SoundPreset>('tone');
  const [recorded, setRecorded] = useState<Float32Array | null>(null);
  const [rate, setRate] = useState(8000);
  const [bits, setBits] = useState(4);
  const [view, setView] = useState<'explore' | 'walkthrough' | 'blind'>(
    'explore',
  );
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(0);
  const [offset, setOffset] = useState(0);
  const [windowMs, setWindowMs] = useState(10);
  const [showBinary, setShowBinary] = useState(true);
  const [experiment, setExperiment] = useState<ListeningExperiment>('rate');
  const [swapped, setSwapped] = useState(randomOrder);
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState(
    'Start at a comfortable volume. All playback uses the same fixed gain.',
  );
  const audio = useStudioAudio();
  const source = useMemo(
    () => recorded ?? makeSound(preset),
    [recorded, preset],
  );
  const processed = useMemo(
    () => processSound(source, SOURCE_RATE, rate, bits),
    [source, rate, bits],
  );
  const trial = listeningExperiments[experiment];
  const blindSource = useMemo(() => makeSound(trial.source), [trial.source]);
  const versions = useMemo(
    () => [
      processSound(blindSource, SOURCE_RATE, trial.high.rate, trial.high.bits),
      processSound(blindSource, SOURCE_RATE, trial.low.rate, trial.low.bits),
    ],
    [blindSource, trial],
  );
  const order = swapped ? [versions[1], versions[0]] : versions;
  const first = Math.floor(offset * rate);
  const last = Math.min(
    processed.samples.length - 1,
    first + Math.round((windowMs / 1000) * rate) - 1,
  );
  const sample = Math.max(first, Math.min(last, selected));
  const { stop, cancelRecording } = audio;
  useEffect(() => {
    stop();
    cancelRecording();
  }, [source, rate, bits, view, experiment, stop, cancelRecording]);
  function changeView(next: typeof view) {
    stop();
    cancelRecording();
    setView(next);
  }
  function newRound(next = experiment) {
    stop();
    setExperiment(next);
    setSwapped(randomOrder());
    setRevealed(false);
    setStatus(
      'New listening round ready. Settings are hidden until you reveal them.',
    );
  }
  function choosePreset(next: SoundPreset) {
    stop();
    cancelRecording();
    setRecorded(null);
    setPreset(next);
    setOffset(0);
    setSelected(0);
  }
  return (
    <StudioLayout
      title="Sound Sampling Studio"
      kind="sound"
      showSettings={view !== 'blind'}
      reference={
        <>
          <h2>A wave. A measurement. A binary code.</h2>
          <div className="studio-concepts">
            <article>
              <h3>Sample rate</h3>
              <p>
                The number of samples taken per second, measured in Hz. A higher
                rate captures more detail in time and can represent higher
                frequencies.
              </p>
            </article>
            <article>
              <h3>Sample resolution</h3>
              <p>
                The number of bits used to represent each sample. More bits
                provide more amplitude levels and reduce rounding error.
              </p>
            </article>
            <article>
              <h3>Theoretical raw size</h3>
              <p>
                Sample rate × duration × bits per sample, for mono audio. Divide
                bits by 8 for bytes; divide bytes by 1,024 for KiB. More
                channels multiply the data.
              </p>
            </article>
          </div>
          <details>
            <summary>
              Explore further · what this model does and does not show
            </summary>
            <p>
              The built-in sources are generated digitally at 48 kHz. Browser
              microphone recordings have already passed through a real hardware
              ADC; this lab re-samples and re-quantises that digital reference
              to model the process. The microscope shows normalised amplitude,
              not air pressure or voltage.
            </p>
            <p>
              Lower-rate versions are low-pass filtered before re-sampling to
              avoid misleading aliasing. Sample resolution uses a simple
              unsigned, evenly spaced teaching code from 0 to 2ᵇ−1, including
              both endpoints. The connected dots are a visual guide, not a
              literal playback waveform. Dithering is disabled to make
              quantisation error easier to observe. Filtering, Nyquist and
              dithering are extension topics, not required explanations here.
            </p>
            <p>
              Actual audio file sizes also depend on headers, metadata and
              compression. A higher setting cannot recover information already
              missing from the source. Audible differences depend on the
              recording, listening equipment and listener; 16-bit and 24-bit
              audio need not sound distinguishable in class.
            </p>
          </details>
        </>
      }
    >
      <div className="studio-modebar">
        <div className="studio-switch">
          {(['explore', 'walkthrough', 'blind'] as const).map((mode) => (
            <Button
              key={mode}
              variant={view === mode ? 'default' : 'ghost'}
              aria-pressed={view === mode}
              onClick={() => changeView(mode)}
            >
              {mode === 'blind' ? (
                <>
                  <Ear />
                  Blind listening
                </>
              ) : mode === 'explore' ? (
                'Explore'
              ) : (
                'Walkthrough'
              )}
            </Button>
          ))}
        </div>
        <span className="studio-meta">0478 / 1.2 · Sound representation</span>
      </div>
      {view === 'blind' ? (
        <div className="blind-workspace">
          <div className="blind-heading">
            <p className="studio-kicker">Listen first. Reveal later.</p>
            <h2>
              Close your eyes.
              <br />
              Open your ears.
            </h2>
            <p>
              Play both versions of the same three-second clip. Discuss what you
              hear before looking at the settings.
            </p>
          </div>
          <div
            className="studio-switch blind-experiments"
            aria-label="Listening experiment"
          >
            {(Object.keys(listeningExperiments) as ListeningExperiment[]).map(
              (id) => (
                <Button
                  key={id}
                  variant={experiment === id ? 'default' : 'outline'}
                  aria-pressed={experiment === id}
                  onClick={() => newRound(id)}
                >
                  {listeningExperiments[id].label}
                </Button>
              ),
            )}
          </div>
          <p className="blind-question">{trial.question}</p>
          <div className="listening-pair">
            {order.map((version, i) => (
              <section key={i} className="listening-card">
                <span className="listening-letter" aria-hidden="true">
                  {i ? 'B' : 'A'}
                </span>
                <Button
                  variant="default"
                  disabled={audio.recording}
                  onClick={() =>
                    audio.play(version.samples, version.rate, i ? 'B' : 'A')
                  }
                >
                  <Play />
                  Play {i ? 'B' : 'A'}
                </Button>
                {revealed ? (
                  <div className="listening-answer">
                    <h3>
                      {number(version.rate)} Hz · {version.bits} bits
                    </h3>
                    <p>
                      {number(2 ** version.bits)} levels ·{' '}
                      {number(version.totalBits / 8)} bytes
                    </p>
                    <SoundScope
                      compact
                      source={blindSource}
                      processed={version}
                      offset={experiment === 'resolution' ? 2 : 0}
                      windowMs={10}
                      selected={0}
                    />
                  </div>
                ) : (
                  <p className="studio-meta">Settings hidden</p>
                )}
              </section>
            ))}
          </div>
          <div className="studio-row blind-actions">
            <Button
              variant="outline"
              disabled={!audio.playing}
              onClick={audio.stop}
            >
              <Square />
              Stop
            </Button>
            <Button
              variant="accent"
              disabled={revealed}
              onClick={() => {
                setRevealed(true);
                setStatus(
                  'Settings revealed. Compare the evidence with what you heard.',
                );
              }}
            >
              Reveal settings
            </Button>
            <Button variant="outline" onClick={() => newRound()}>
              <Shuffle />
              New round
            </Button>
          </div>
          {revealed && (
            <aside className="blind-explanation">
              <h3>What changed?</h3>
              <p>{trial.explanation}</p>
              <p className="studio-meta">
                Source: {soundPresets.find((p) => p.id === trial.source)?.label}
                . Pale line: reference; lime line: quantised samples. Size is
                theoretical raw mono audio data, excluding file overhead.
              </p>
            </aside>
          )}
          <p className="blind-fairness">
            Same source · same duration · same playback speed · same gain ·
            random A/B order
            <br />
            No scores, no right-ear contest. Describe the difference, then
            explain it.
          </p>
        </div>
      ) : (
        <>
          <div className="studio-formula" aria-label="Sound data formula">
            <strong>{number(rate)} samples/s</strong>
            <span>
              × {processed.duration.toFixed(0)} s × {bits} bits
            </span>
            <ArrowRight size={18} />
            <strong>{number(processed.totalBits)} bits</strong>
            <span>
              = {number(processed.totalBits / 8)} bytes ·{' '}
              {(processed.totalBits / 8 / 1024).toFixed(2)} KiB
            </span>
          </div>
          <div className="studio-grid">
            <div className="studio-stage" tabIndex={-1}>
              <section className="studio-panel sound-source">
                <div className="studio-row">
                  <h2>
                    <AudioLines size={20} />
                    01 / Sound source
                  </h2>
                  <span className="studio-meta">Mono · 3 seconds</span>
                </div>
                <div className="sound-sources">
                  {soundPresets.map((p) => (
                    <Button
                      key={p.id}
                      variant={
                        !recorded && preset === p.id ? 'default' : 'outline'
                      }
                      aria-pressed={!recorded && preset === p.id}
                      onClick={() => choosePreset(p.id)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
                <p className="studio-muted">
                  {recorded
                    ? 'Your microphone recording · processed locally, never uploaded.'
                    : soundPresets.find((p) => p.id === preset)?.description}
                </p>
                <div className="studio-row playback-controls">
                  <Button
                    variant="outline"
                    disabled={audio.recording}
                    onClick={() => audio.play(source, SOURCE_RATE, 'Reference')}
                  >
                    <Play />
                    Play reference
                  </Button>
                  <Button
                    variant="accent"
                    disabled={audio.recording}
                    onClick={() =>
                      audio.play(processed.samples, rate, 'Digital')
                    }
                  >
                    <Play />
                    Play digital
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={!audio.playing}
                    onClick={audio.stop}
                  >
                    <Square />
                    Stop
                  </Button>
                </div>
              </section>
              <section className="studio-panel scope-panel">
                <div className="studio-row">
                  <h2>02 / ADC microscope</h2>
                  <span className="studio-meta">Time → · Amplitude ↕</span>
                </div>
                <div className="scope-legend">
                  <span>— Reference</span>
                  <span>— Quantised samples</span>
                  <span>Selected: #{sample + 1}</span>
                </div>
                <SoundScope
                  source={source}
                  processed={processed}
                  offset={offset}
                  windowMs={windowMs}
                  selected={sample}
                  onSelect={setSelected}
                />
                <p className="studio-meta">
                  Select a dot or use the sample slider and arrow keys.{' '}
                  {2 ** bits > 16
                    ? 'Only 16 guide lines shown; all amplitude levels are still used.'
                    : `All ${2 ** bits} available amplitude levels shown.`}
                </p>
              </section>
              <section
                className="studio-panel sample-readout"
                aria-label="Selected sample details"
              >
                <div>
                  <span>Time</span>
                  <strong>{((sample / rate) * 1000).toFixed(3)} ms</strong>
                </div>
                <div>
                  <span>Measured</span>
                  <strong>{processed.measured[sample].toFixed(4)}</strong>
                </div>
                <ArrowRight size={18} />
                <div>
                  <span>Quantised</span>
                  <strong>{processed.samples[sample].toFixed(4)}</strong>
                </div>
                <div>
                  <span>Code (decimal)</span>
                  <strong>{processed.codes[sample]}</strong>
                </div>
                <div>
                  <span>{bits}-bit code</span>
                  <strong>
                    {showBinary
                      ? binary(processed.codes[sample], bits)
                      : 'Hidden'}
                  </strong>
                </div>
              </section>
              <section className="studio-panel tape-panel">
                <div className="studio-row">
                  <h2>03 / Binary sequence</h2>
                  <label className="studio-check">
                    <input
                      type="checkbox"
                      checked={showBinary}
                      onChange={(e) => setShowBinary(e.target.checked)}
                    />
                    Reveal codes
                  </label>
                </div>
                {showBinary ? (
                  <div
                    className="binary-tape sound-tape"
                    aria-label="Sample binary sequence"
                  >
                    {Array.from(
                      { length: Math.min(16, last - first + 1) },
                      (_, i) => first + i,
                    ).map((i) => (
                      <button
                        key={i}
                        aria-label={`Select sample ${i + 1}`}
                        aria-pressed={sample === i}
                        onClick={() => setSelected(i)}
                      >
                        <code>{binary(processed.codes[i], bits)}</code>
                        <span>#{number(i + 1)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="studio-muted">
                    Predict the code, then reveal it.
                  </p>
                )}
                <p className="studio-meta">
                  First 16 samples of the visible window, in time order.
                  Boundaries are visual guides, not stored bits. Full clip:{' '}
                  {number(processed.samples.length)} samples.
                </p>
              </section>
            </div>
            <aside
              className="studio-rail"
              aria-label="Sound controls"
              tabIndex={-1}
            >
              {view === 'walkthrough' && (
                <Walkthrough steps={lessons} step={step} setStep={setStep} />
              )}
              <div>
                <p className="studio-kicker">Time precision</p>
                <label className="studio-field">
                  Sample rate
                  <select
                    aria-label="Sample rate"
                    value={rate}
                    onChange={(e) => {
                      stop();
                      setRate(Number(e.target.value));
                      setSelected(0);
                      setOffset(0);
                      setStatus('Re-sampled from the original source.');
                    }}
                  >
                    {[4000, 8000, 16000, 32000, 48000].map((r) => (
                      <option key={r} value={r}>
                        {number(r)} Hz
                      </option>
                    ))}
                  </select>
                </label>
                <p className="studio-muted">
                  One sample every{' '}
                  <strong>{(1000 / rate).toFixed(4)} ms</strong>.
                </p>
              </div>
              <div>
                <p className="studio-kicker">Amplitude precision</p>
                <label className="studio-field">
                  Sample resolution
                  <select
                    aria-label="Sample resolution"
                    value={bits}
                    onChange={(e) => {
                      stop();
                      setBits(Number(e.target.value));
                      setStatus(
                        'Amplitude levels updated from the original source.',
                      );
                    }}
                  >
                    {[2, 3, 4, 6, 8, 12, 16].map((b) => (
                      <option key={b} value={b}>
                        {b} bits per sample
                      </option>
                    ))}
                  </select>
                </label>
                <p className="studio-muted">
                  2<sup>{bits}</sup> ={' '}
                  <strong>{number(2 ** bits)} amplitude levels</strong>.
                </p>
              </div>
              <div className="scope-controls">
                <label className="studio-field">
                  Window
                  <select
                    aria-label="Waveform window"
                    value={windowMs}
                    onChange={(e) => setWindowMs(Number(e.target.value))}
                  >
                    {[5, 10, 20].map((ms) => (
                      <option key={ms} value={ms}>
                        {ms} ms
                      </option>
                    ))}
                  </select>
                </label>
                <label className="studio-field">
                  Position: {offset.toFixed(2)} s
                  <input
                    type="range"
                    min="0"
                    max="2.98"
                    step="0.01"
                    value={offset}
                    onChange={(e) => {
                      setOffset(Number(e.target.value));
                      setSelected(Math.floor(Number(e.target.value) * rate));
                    }}
                    aria-label="Window position"
                  />
                </label>
                <label className="studio-field">
                  Sample in this window
                  <input
                    type="range"
                    min={first}
                    max={last}
                    value={sample}
                    onChange={(e) => setSelected(Number(e.target.value))}
                    aria-label="Selected sample"
                  />
                </label>
              </div>
              <div className="studio-note">
                <h3>Change one thing.</h3>
                <p>
                  Hold sample resolution steady while changing sample rate. Then
                  fix sample rate and change sample resolution.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    changeView('blind');
                    newRound();
                  }}
                >
                  <Ear />
                  Try blind listening
                </Button>
              </div>
              <div className="recording-panel">
                <h3>Bring your own voice</h3>
                <p className="studio-meta">
                  Optional 3-second microphone recording. Permission is
                  requested only when you press Record. Nothing is saved or
                  uploaded.
                </p>
                {audio.recording ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      stop();
                      cancelRecording();
                    }}
                  >
                    <Square />
                    Cancel recording
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() =>
                      audio.record((data) => {
                        setRecorded(data);
                        setSelected(0);
                        setOffset(0);
                        setStatus(
                          'Recording ready. Compare the same voice at different settings.',
                        );
                      })
                    }
                  >
                    <Mic />
                    Record 3 seconds
                  </Button>
                )}
                {audio.recording && (
                  <output>
                    Microphone requested · recording stops automatically after 3
                    seconds.
                  </output>
                )}
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  choosePreset('tone');
                  setRate(8000);
                  setBits(4);
                  setWindowMs(10);
                  setShowBinary(true);
                  setStep(0);
                  setStatus('Sound demo reset.');
                }}
              >
                Reset demo
              </Button>
            </aside>
          </div>
        </>
      )}
      <output className="studio-status">
        {audio.error ||
          (audio.playing
            ? `Playing ${audio.playing} · fixed volume, original speed.`
            : status)}
      </output>
    </StudioLayout>
  );
}
