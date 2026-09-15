import { useEffect, useMemo, useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import {
  ArrowRight,
  AudioLines,
  Image as ImageIcon,
  Play,
  RotateCcw,
  Square,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { StudioLayout } from '../components/StudioLayout';
import { PixelPreview, WavePreview } from '../components/QualityVisuals';
import { fileSizeLabRoute } from '../data/syllabus';
import { extractCanonicalCrop } from '../lib/imageMath';
import { useStudioAudio } from '../lib/useStudioAudio';
import {
  formatBytes,
  imageSteps,
  number,
  qualityImage,
  qualityLabels,
  qualityModes,
  qualitySound,
  rateSteps,
  type QualityMode,
} from '../lib/qualityLab';
import '../effects.css';

const settings = {
  'sample-resolution': {
    min: 4,
    max: 16,
    fixed: '48,000 samples/s · 3 seconds · Mono',
    conclusion: 'More amplitude levels. Less rounding error.',
  },
  'sample-rate': {
    min: 0,
    max: 5,
    fixed: '16 bits/sample · 3 seconds · Mono',
    conclusion: 'More samples each second. More high-frequency detail.',
  },
  'image-resolution': {
    min: 0,
    max: 4,
    fixed: '4 bits/pixel · Same source · Same display size',
    conclusion: 'More pixels. Finer image detail.',
  },
  'colour-depth': {
    min: 1,
    max: 8,
    fixed: '32 × 32 pixels · Same source · Same display size',
    conclusion: 'More possible colours. Finer colour differences.',
  },
} as const;

function valueAt(mode: QualityMode, step: number) {
  return mode === 'sample-rate'
    ? rateSteps[step]
    : mode === 'image-resolution'
      ? imageSteps[step]
      : step;
}
function valueLabel(mode: QualityMode, value: number) {
  if (mode === 'sample-rate') return `${number(value)} samples/s`;
  if (mode === 'image-resolution') return `${value} × ${value} pixels`;
  return `${value} bits/${mode === 'colour-depth' ? 'pixel' : 'sample'}`;
}

function QualityExperiment({ mode }: { mode: QualityMode }) {
  const config = settings[mode];
  const [step, setStep] = useState<number>(config.max);
  const [imageSource, setImageSource] = useState<ImageData | null>(null);
  const [imageError, setImageError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const audio = useStudioAudio();
  const isSound = mode === 'sample-resolution' || mode === 'sample-rate';
  const before = valueAt(mode, config.min);
  const after = valueAt(mode, step);

  useEffect(() => {
    if (isSound) return;
    let cancelled = false;
    const image = new window.Image();
    image.onload = () => {
      if (cancelled) return;
      try {
        setImageSource(extractCanonicalCrop(image));
      } catch {
        setImageError(true);
      }
    };
    image.onerror = () => {
      if (!cancelled) setImageError(true);
    };
    image.src = `${import.meta.env.BASE_URL}assets/mona-lisa-beads.png`;
    return () => {
      cancelled = true;
      image.onload = image.onerror = null;
    };
  }, [isSound, attempt]);

  const sounds = useMemo(
    () =>
      isSound ? [qualitySound(mode, before), qualitySound(mode, after)] : null,
    [isSound, mode, before, after],
  );
  const images = useMemo(
    () =>
      !isSound && imageSource
        ? [before, after].map((value) =>
            qualityImage(
              imageSource,
              mode === 'image-resolution' ? value : 32,
              mode === 'colour-depth' ? value : 4,
            ),
          )
        : null,
    [isSound, imageSource, mode, before, after],
  );
  const bytes = sounds
    ? sounds.map((sound) => Math.ceil(sound.processed.totalBits / 8))
    : images?.map((image) => image.rawBytes);
  const params = bytes
    ? new URLSearchParams({
        beforeBytes: String(bytes[0]),
        afterBytes: String(bytes[1]),
        source: mode,
      })
    : null;

  function changeStep(next: number) {
    audio.stop();
    setStep(next);
  }
  function play(index: number) {
    if (!sounds) return;
    const sound = sounds[index].processed;
    void audio.play(
      sound.samples,
      sound.rate,
      index === 0 ? 'Before' : 'After',
    );
  }
  function playPair() {
    if (!sounds) return;
    void audio.play(
      sounds[0].processed.samples,
      sounds[0].processed.rate,
      'A → B · Before',
      () => {
        void audio.play(
          sounds[1].processed.samples,
          sounds[1].processed.rate,
          'A → B · After',
        );
      },
    );
  }
  return (
    <div className="effect-experiment">
      <div className="effect-context">
        <span className="effect-kicker">One variable. Two versions.</span>
        <span>{config.fixed}</span>
      </div>
      <div className="quality-comparison">
        {[before, after].map((value, index) => (
          <section
            className={`quality-card ${index === 1 ? 'quality-card--after' : ''}`}
            key={index}
            aria-label={index === 0 ? 'Before comparison' : 'After comparison'}
          >
            <header className="quality-card-header">
              <span className="effect-version">{index === 0 ? 'A' : 'B'}</span>
              <div>
                <span className="effect-kicker">
                  {index === 0 ? 'Before · Fixed' : 'After · Your version'}
                </span>
                <h2>{valueLabel(mode, value)}</h2>
              </div>
              {isSound ? (
                <AudioLines aria-hidden="true" />
              ) : (
                <ImageIcon aria-hidden="true" />
              )}
            </header>
            {sounds ? (
              <WavePreview
                source={sounds[index].source}
                processed={sounds[index].processed}
                quiet={mode === 'sample-resolution'}
                label={`${index === 0 ? 'Before' : 'After'}: ${valueLabel(mode, value)}. Original signal and encoded samples, 8 ms window.`}
              />
            ) : images ? (
              <div className="quality-image-well">
                <PixelPreview
                  data={images[index]}
                  label={`${index === 0 ? 'Before' : 'After'} Mona Lisa at ${valueLabel(mode, value)}`}
                />
              </div>
            ) : (
              <output className="quality-image-well quality-image-placeholder">
                {imageError ? (
                  <>
                    <ImageIcon />
                    <span>The reference image could not load.</span>
                    {index === 1 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setImageError(false);
                          setAttempt((value) => value + 1);
                        }}
                      >
                        Retry image
                      </Button>
                    )}
                  </>
                ) : (
                  'Loading the reference…'
                )}
              </output>
            )}
            <div className="quality-card-metrics">
              <div>
                <strong>
                  {number(
                    mode === 'sample-resolution' || mode === 'colour-depth'
                      ? 2 ** value
                      : mode === 'image-resolution'
                        ? value ** 2
                        : value * 3,
                  )}
                </strong>
                <span>
                  {mode === 'sample-resolution'
                    ? 'amplitude levels'
                    : mode === 'colour-depth'
                      ? 'maximum colours'
                      : mode === 'image-resolution'
                        ? 'total pixels'
                        : 'samples in 3 seconds'}
                </span>
              </div>
              {sounds ? (
                <Button
                  size="lg"
                  variant={index ? 'accent' : 'outline'}
                  onClick={() => play(index)}
                >
                  <Play />
                  Play {index === 0 ? 'before' : 'after'}
                </Button>
              ) : (
                <span className="effect-muted">
                  {images ? `${images[index].used} colours used` : '—'}
                </span>
              )}
            </div>
          </section>
        ))}
      </div>
      <div className="effect-control-bar">
        <div className="effect-slider-group">
          <div className="effect-slider-heading">
            <label id="quality-slider-label">{qualityLabels[mode]}</label>
            <output>{valueLabel(mode, after)}</output>
          </div>
          <Slider
            value={[step]}
            min={config.min}
            max={config.max}
            step={1}
            aria-label={qualityLabels[mode]}
            aria-labelledby="quality-slider-label"
            aria-valuetext={valueLabel(mode, after)}
            onValueChange={(value) =>
              changeStep(Array.isArray(value) ? value[0] : value)
            }
          />
          <div className="effect-slider-ends">
            <span>{valueLabel(mode, before)}</span>
            <span>{valueLabel(mode, valueAt(mode, config.max))}</span>
          </div>
        </div>
        <div className="effect-actions">
          {isSound && (
            <Button size="lg" variant="accent" onClick={playPair}>
              <Play />
              Play A → B
            </Button>
          )}
          {isSound && (
            <Button
              size="lg"
              variant="outline"
              onClick={audio.stop}
              disabled={!audio.playing}
            >
              <Square />
              Stop
            </Button>
          )}
          <Button
            size="lg"
            variant="ghost"
            onClick={() => changeStep(config.max)}
            aria-label="Reset this comparison"
          >
            <RotateCcw />
            Reset
          </Button>
        </div>
      </div>
      <div className="effect-caption">
        <p>
          {before === after
            ? 'Same setting. Same representation and raw size.'
            : config.conclusion}
        </p>
        {isSound ? (
          <output>
            {audio.playing ? `Playing ${audio.playing}` : 'Ready to listen'}
          </output>
        ) : (
          <span>White frame excluded from sampling</span>
        )}
      </div>
      {audio.error && (
        <div className="studio-error" role="alert">
          {audio.error}
          <Button variant="outline" onClick={playPair}>
            Retry playback
          </Button>
        </div>
      )}
      <footer className="quality-result">
        <div>
          <span className="effect-kicker">
            Raw {isSound ? 'sample' : 'pixel'} data
          </span>
          <div className="quality-size-flow">
            <strong title={bytes ? `${number(bytes[0])} bytes` : undefined}>
              {bytes ? formatBytes(bytes[0]) : '—'}
            </strong>
            <ArrowRight />
            <strong title={bytes ? `${number(bytes[1])} bytes` : undefined}>
              {bytes ? formatBytes(bytes[1]) : '—'}
            </strong>
            <span className="effect-multiplier">
              ×{bytes ? number(bytes[1] / bytes[0]) : '—'}
            </span>
          </div>
        </div>
        {params ? (
          <Link
            className={buttonVariants({ variant: 'accent', size: 'lg' })}
            to={`${fileSizeLabRoute}?${params}`}
          >
            See file-size impact <ArrowRight />
          </Link>
        ) : (
          <Button size="lg" variant="accent" disabled>
            See file-size impact <ArrowRight />
          </Button>
        )}
      </footer>
    </div>
  );
}

export function QualityLabPage() {
  const [mode, setMode] = useState<QualityMode>('sample-resolution');
  return (
    <StudioLayout
      title="Quality Lab"
      kind="quality"
      showSettings={false}
      collapseReference
      referenceTitle="Teacher notes"
      reference={
        <div className="effect-teacher-notes">
          <p>
            <strong>Sound:</strong> sample rate × seconds × bits per sample ×
            channels = bits. These clips are 3-second mono signals. More bits
            provide more amplitude levels and less quantisation error; a higher
            sample rate can represent higher frequencies. The low-rate example
            is low-pass filtered before sampling, not played more slowly.
          </p>
          <p>
            <strong>Image:</strong> width × height × bits per pixel = bits.
            Resolution means pixel dimensions and total pixels, not DPI. Colour
            depth gives up to 2ᵇ colours. This indexed-colour demonstration
            samples the same original image every time, without dithering.
          </p>
          <p>
            <strong>Size:</strong> divide bits by 8 for bytes. These are
            theoretical raw pixel/sample data sizes, excluding headers,
            metadata, palettes and alpha. Actual PNG, JPEG and audio files also
            depend on their format and compression. kB and MB here are decimal;
            1 KiB = 1,024 bytes.
          </p>
          <p>
            <strong>Fair comparison:</strong> playback gain, duration and
            display scales are identical. The waveform grid is a reference
            scale, not a count of quantisation levels. Higher settings can
            preserve more source detail; they cannot create detail missing from
            the source. Audible differences also depend on hearing and playback
            equipment.
          </p>
        </div>
      }
    >
      <Tabs.Root
        value={mode}
        onValueChange={(value) => setMode(value as QualityMode)}
        className="effect-lab"
      >
        <Tabs.List className="effect-tabs" aria-label="Quality experiments">
          {qualityModes.map((entry, index) => (
            <Tabs.Tab key={entry} value={entry}>
              <span className="effect-tab-number">0{index + 1}</span>
              {qualityLabels[entry]}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel value={mode} key={mode}>
          <QualityExperiment mode={mode} />
        </Tabs.Panel>
      </Tabs.Root>
    </StudioLayout>
  );
}
