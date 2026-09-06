// oxlint-disable jsx-a11y/prefer-tag-over-role -- Inline SVG needs role="img" and accessible title/description; an img cannot contain the data chart.
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StudioLayout } from '../components/StudioLayout';
import { soundStudioRoute } from '../data/syllabus';
import { journeyAmplitude, journeySamples } from '../lib/soundJourney';
import '../sound-journey.css';

const steps = [
  {
    name: 'Capture',
    title: 'A continuous analogue signal',
    text: 'A microphone converts sound into an electrical signal that varies continuously.',
    idea: 'Continuous in time and amplitude',
  },
  {
    name: 'Sample',
    title: 'Measure at regular intervals',
    text: 'At 8 Hz, take one amplitude measurement every 0.125 seconds. The amplitudes have not yet been rounded.',
    idea: '8 Hz = 8 samples per second',
  },
  {
    name: 'Quantise',
    title: 'Round to the nearest level',
    text: '4 bits provide 16 available levels, numbered 0–15. Round each measured amplitude to the nearest level.',
    idea: '4 bits = 16 amplitude levels',
  },
  {
    name: 'Encode',
    title: 'Write each level in binary',
    text: 'Represent each level with exactly 4 bits, then join the codes in time order.',
    idea: '10 samples × 4 bits = 40 bits',
  },
];
const px = (time: number) => 72 + (time / 1.25) * 868;
const py = (level: number) => 344 - (level / 15) * 300;
const waveform = Array.from({ length: 501 }, (_, i) => {
  const time = (i / 500) * 1.25;
  return `${i ? 'L' : 'M'}${px(time)},${py(journeyAmplitude(time))}`;
}).join(' ');

export function SoundJourneyPage() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(3);
  const [playing, setPlaying] = useState(false);
  const sample = journeySamples[selected];
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (step === 2) setPlaying(false);
      setStep((previous) => Math.min(3, previous + 1));
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [playing, step]);
  function changeStep(next: number) {
    setPlaying(false);
    setStep(next);
  }
  return (
    <StudioLayout
      title="How sound becomes binary"
      kind="sound"
      showSettings={false}
      reference={
        <>
          <h2>One signal, four stages.</h2>
          <p>
            This slow, illustrative signal makes each step visible. Real audio
            uses much higher sample rates. Capture and sampling still have
            amplitude values; their labels are hidden here until quantisation
            introduces the available levels.
          </p>
          <p>
            The same amplitude scale and 0–1.25 second window stay fixed
            throughout. Ten samples are taken at 0, 0.125, …, 1.125 seconds. The
            right edge is the end of the window, not an extra sample.
          </p>
          <Link to={soundStudioRoute}>
            Explore sample rate and resolution in Sound Sampling Studio{' '}
            <ArrowRight size={16} />
          </Link>
        </>
      }
    >
      <div className="sound-journey">
        <nav className="journey-steps" aria-label="Sound digitisation stages">
          {steps.map((item, index) => (
            <button
              key={item.name}
              aria-current={step === index ? 'step' : undefined}
              onClick={() => changeStep(index)}
            >
              <span className="journey-step-number">0{index + 1}</span>
              <strong>{item.name}</strong>
              {index < 3 && <ArrowRight aria-hidden="true" />}
            </button>
          ))}
        </nav>
        <div className="journey-workspace">
          <section className="journey-plot" aria-label="Signal diagram">
            <div className="journey-plot-heading">
              <span>
                {step === 0
                  ? 'Analogue signal'
                  : step === 1
                    ? 'Signal + measured samples'
                    : step === 2
                      ? 'Measured → quantised'
                      : 'Quantised samples'}
              </span>
              <span>
                {step > 0 ? '8 Hz' : 'Continuous'}
                {step >= 2 ? ' / 4 bits' : ''}
              </span>
            </div>
            <svg
              className="journey-scope"
              viewBox="0 0 980 415"
              role="img"
              aria-labelledby="journey-chart-title journey-chart-desc"
            >
              <title id="journey-chart-title">
                {steps[step].name} signal diagram
              </title>
              <desc id="journey-chart-desc">
                {step === 0
                  ? 'Continuous wave without numeric axes or grid lines.'
                  : step === 1
                    ? 'Ten evenly spaced samples with vertical time guides and no amplitude labels.'
                    : 'Sixteen amplitude levels from zero to fifteen. Sample times are unchanged.'}{' '}
                {step > 0 &&
                  `Selected sample ${selected + 1}, time ${sample.time.toFixed(3)} seconds.`}
              </desc>
              {step > 0 &&
                Array.from({ length: 11 }, (_, i) => (
                  <g key={i} className="journey-time-guide">
                    <line x1={px(i / 8)} x2={px(i / 8)} y1="44" y2="344" />
                    <text x={px(i / 8)} y="372" textAnchor="middle">
                      {(i / 8).toFixed(3)}
                    </text>
                  </g>
                ))}
              {step >= 2 &&
                Array.from({ length: 16 }, (_, level) => (
                  <g key={level} className="journey-level-guide">
                    <line x1="72" x2="940" y1={py(level)} y2={py(level)} />
                    <text x="57" y={py(level) + 5} textAnchor="end">
                      {level}
                    </text>
                  </g>
                ))}
              <path className="journey-axis" d="M72 44V344H940" />
              <text
                className="journey-axis-label"
                x="500"
                y="408"
                textAnchor="middle"
              >
                {step ? 'Time (s)' : 'Time'}
              </text>
              <text
                className="journey-axis-label"
                transform="translate(23 190) rotate(-90)"
                textAnchor="middle"
              >
                {step >= 2 ? 'Amplitude level' : 'Amplitude'}
              </text>
              {step < 2 && (
                <path
                  className={`journey-wave ${step ? 'journey-wave--muted' : ''}`}
                  d={waveform}
                />
              )}
              {step > 0 &&
                journeySamples.map((point, i) => (
                  <g key={point.time}>
                    {step === 2 && (
                      <>
                        <circle
                          className="journey-measured"
                          cx={px(point.time)}
                          cy={py(point.measured)}
                          r="6"
                        />
                        <line
                          className="journey-rounding"
                          x1={px(point.time)}
                          x2={px(point.time)}
                          y1={py(point.measured)}
                          y2={py(point.level)}
                        />
                      </>
                    )}
                    {step === 3 && (
                      <line
                        className="journey-stem"
                        x1={px(point.time)}
                        x2={px(point.time)}
                        y1="344"
                        y2={py(point.level)}
                      />
                    )}
                    <circle
                      className={
                        i === selected
                          ? 'journey-dot journey-dot--selected'
                          : 'journey-dot'
                      }
                      cx={px(point.time)}
                      cy={py(step >= 2 ? point.level : point.measured)}
                      r={i === selected ? 9 : 5}
                    />
                  </g>
                ))}
            </svg>
            <div className="journey-chart-key">
              {step === 2 ? (
                <>
                  <span>
                    <i className="journey-key-measured" />
                    Measured
                  </span>
                  <span>
                    <i />
                    Quantised
                  </span>
                </>
              ) : (
                <span>
                  {step === 0
                    ? 'No samples yet'
                    : 'Outlined dot: selected sample'}
                </span>
              )}
              <span>Same signal, same scale</span>
            </div>
          </section>
          <section
            className="journey-explanation"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="studio-kicker">Step {step + 1} of 4</p>
            <h2>{steps[step].title}</h2>
            <p>{steps[step].text}</p>
            <div className="journey-big-readout">
              {step === 0
                ? 'Analogue'
                : step === 1
                  ? '0.125 s'
                  : step === 2
                    ? `${sample.measured.toFixed(1)} → ${sample.level}`
                    : `${sample.level} → ${sample.code}`}
            </div>
            <p className="journey-idea">{steps[step].idea}</p>
            {step > 0 && (
              <p className="journey-sample-detail">
                Sample {selected + 1} at {sample.time.toFixed(3)} s
                {step >= 2 ? ` · measured ${sample.measured.toFixed(1)}` : ''}
              </p>
            )}
          </section>
        </div>
        {step > 0 && (
          <div className="journey-selection">
            <label htmlFor="journey-sample">
              Follow sample <strong>{selected + 1}</strong> of 10
            </label>
            <input
              id="journey-sample"
              type="range"
              min="0"
              max="9"
              value={selected}
              onChange={(event) => setSelected(Number(event.target.value))}
              aria-label="Selected sample"
            />
            <span>{sample.time.toFixed(3)} s</span>
          </div>
        )}
        {step === 3 && (
          <section
            className="journey-codes"
            aria-label="Binary sequence in time order"
          >
            {journeySamples.map((point, i) => (
              <button
                key={i}
                aria-label={`Sample ${i + 1}: ${point.code}`}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                <small>#{i + 1}</small>
                <code>{point.code}</code>
              </button>
            ))}
          </section>
        )}
        <div className="journey-controls">
          <Button
            variant="outline"
            onClick={() => {
              changeStep(0);
              setSelected(3);
            }}
          >
            <RotateCcw />
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (playing) setPlaying(false);
              else {
                if (step === 3) setStep(0);
                setPlaying(true);
              }
            }}
          >
            {playing ? <Pause /> : <Play />}
            {playing ? 'Pause demo' : 'Auto-play steps'}
          </Button>
          <div className="journey-pagination">
            <Button
              variant="ghost"
              disabled={step === 0}
              onClick={() => changeStep(step - 1)}
            >
              <ArrowLeft />
              Previous
            </Button>
            <Button disabled={step === 3} onClick={() => changeStep(step + 1)}>
              Next step
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
