import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StudioLayout } from '../components/StudioLayout';
import { simulatorRoute } from '../data/syllabus';
import { makeImageJourney } from '../lib/imageJourney';
import '../image-journey.css';

const steps = [
  {
    name: 'Pixels',
    title: 'An image is made of pixels.',
    text: 'A raster image is a grid of tiny picture elements called pixels. Each pixel represents one colour. Select a square to inspect it.',
  },
  {
    name: 'Resolution',
    title: 'Count across. Count down. Multiply.',
    text: 'Width is the number of columns. Height is the number of rows. Width × height gives the total number of pixels: the image resolution.',
  },
  {
    name: 'Colour codes',
    title: 'Represent each colour with a binary code.',
    text: 'Colour depth is the number of bits used to represent the colour of each pixel. In this palette model, each colour has its own code. Pixels of the same colour share that code.',
  },
  {
    name: 'Sequence',
    title: 'Store the codes in a fixed order.',
    text: 'Read left to right across the first row, then start at the left of the next row. Join the colour codes in that order to form the image’s binary sequence.',
  },
];

export function ImageJourneyPage() {
  const [step, setStep] = useState(0);
  const [width, setWidth] = useState(4),
    [height, setHeight] = useState(4),
    [bits, setBits] = useState(2);
  const [selected, setSelected] = useState(0),
    [scanned, setScanned] = useState(0),
    [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState(
    'Select any pixel. Then use Next stage to follow its journey into binary.',
  );
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const model = useMemo(
    () => makeImageJourney(width, height, bits),
    [width, height, bits],
  );
  const pixel = model.pixels[selected];
  const colour = model.palette[pixel.colourIndex];
  const instruction = steps[step];
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      setSelected(scanned);
      setScanned(scanned + 1);
      if (scanned + 1 >= model.pixels.length) {
        setPlaying(false);
        setStatus(
          'Scan complete. Every pixel has contributed one colour code.',
        );
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [playing, scanned, model.pixels.length]);
  function changeStep(next: number) {
    setPlaying(false);
    setStep(next);
    setStatus(`Stage ${next + 1}: ${steps[next].title}`);
  }
  function configure(w = width, h = height, b = bits) {
    setPlaying(false);
    setScanned(0);
    setSelected(0);
    setWidth(w);
    setHeight(h);
    setBits(b);
    setStatus('Test bitmap rebuilt. The sequence scan has restarted.');
  }
  function choosePixel(index: number) {
    setPlaying(false);
    setSelected(index);
    setStatus(
      `Pixel ${index + 1}: row ${Math.floor(index / width) + 1}, column ${(index % width) + 1}.`,
    );
  }
  function nextPixel() {
    setPlaying(false);
    if (scanned < model.pixels.length) {
      setSelected(scanned);
      setScanned(scanned + 1);
      setStatus(`Stored pixel ${scanned + 1} of ${model.pixels.length}.`);
    }
  }
  function reset() {
    configure(4, 4, 2);
    setStep(0);
    setStatus('Back to a 4 × 4 image at 2 bits per pixel.');
  }
  return (
    <StudioLayout
      title="How an image becomes binary"
      kind="image"
      showSettings={false}
      reference={
        <>
          <h2>Pixels → colour codes → binary sequence.</h2>
          <div className="studio-concepts">
            <article>
              <h3>Image resolution</h3>
              <p>
                Pixel dimensions and total pixels. A 4 × 4 raster image contains
                16 pixels. This is not PPI or DPI.
              </p>
            </article>
            <article>
              <h3>Colour depth</h3>
              <p>
                Bits used to represent each pixel’s colour. With b bits, up to
                2ᵇ colours can be represented. A pixel has one colour code, not
                a different code from every other pixel.
              </p>
            </article>
            <article>
              <h3>Storage order</h3>
              <p>
                This demo stores pixels row by row. The decoder needs the
                dimensions, colour depth, palette and storage order to
                reconstruct the same image.
              </p>
            </article>
          </div>
          <details>
            <summary>
              A teaching bitmap, not the complete contents of a PNG or JPEG
            </summary>
            <p>
              This small indexed-colour example makes every bit visible. Its
              palette assigns codes to colours; other formats may store RGB
              channel values instead. The binary stream shown is only
              uncompressed pixel data. A real file also needs structural
              information and may contain a palette, metadata, transparency and
              compressed data. Actual formats can use other storage orders.
            </p>
            <p>
              Changing the controls rebuilds the illustrative test pattern. For
              comparisons of image quality, try the Pixel Bead Simulator.
            </p>
          </details>
          <Link className="image-journey-link" to={simulatorRoute}>
            Explore image quality in Pixel Bead Simulator{' '}
            <ArrowRight size={16} />
          </Link>
        </>
      }
    >
      <div
        className={`image-journey ${step === 3 ? 'image-journey-sequence' : ''}`}
      >
        <nav className="image-steps" aria-label="Image encoding stages">
          {steps.map((item, index) => (
            <button
              key={item.name}
              aria-current={step === index ? 'step' : undefined}
              onClick={() => changeStep(index)}
            >
              <span>0{index + 1}</span>
              <strong>{item.name}</strong>
              {index < 3 && <ArrowRight size={16} />}
            </button>
          ))}
        </nav>
        <div className="image-stage-heading">
          <div>
            <p className="studio-kicker">Stage {step + 1} of 4</p>
            <h2>{instruction.title}</h2>
            <p>{instruction.text}</p>
          </div>
          <Button variant="ghost" onClick={reset}>
            <RotateCcw />
            Reset demo
          </Button>
        </div>
        <div className="image-learning-grid">
          <section className="image-board-panel" aria-label="Test bitmap">
            <div className="image-width-label">
              <span>←</span> {width} columns (width) <span>→</span>
            </div>
            <div className="image-board-wrap">
              <div className="image-height-label">{height} rows (height)</div>
              <section
                className="image-pixel-board"
                style={{
                  gridTemplateColumns: `repeat(${width},1fr)`,
                  aspectRatio: `${width}/${height}`,
                  width: `min(100%, ${Math.min(320, (320 * width) / height)}px)`,
                }}
                aria-label={`${width} by ${height} pixel image`}
              >
                {model.pixels.map((cell, index) => {
                  const c = model.palette[cell.colourIndex];
                  return (
                    <button
                      key={index}
                      ref={(element) => {
                        cellRefs.current[index] = element;
                      }}
                      className={`image-pixel ${step === 3 && index < scanned ? 'image-pixel-scanned' : ''}`}
                      style={{ background: c.hex, color: c.ink }}
                      tabIndex={selected === index ? 0 : -1}
                      aria-pressed={selected === index}
                      aria-label={`Pixel ${index + 1}, row ${cell.y + 1}, column ${cell.x + 1}, ${c.name}${step >= 2 ? `, code ${cell.code}` : ''}`}
                      onClick={() => choosePixel(index)}
                      onKeyDown={(event) => {
                        if (
                          ![
                            'ArrowLeft',
                            'ArrowRight',
                            'ArrowUp',
                            'ArrowDown',
                            'Home',
                            'End',
                          ].includes(event.key)
                        )
                          return;
                        event.preventDefault();
                        const next =
                          event.key === 'Home'
                            ? 0
                            : event.key === 'End'
                              ? model.pixels.length - 1
                              : Math.max(
                                  0,
                                  Math.min(
                                    model.pixels.length - 1,
                                    index +
                                      (event.key === 'ArrowLeft'
                                        ? -1
                                        : event.key === 'ArrowRight'
                                          ? 1
                                          : event.key === 'ArrowUp'
                                            ? -width
                                            : width),
                                  ),
                                );
                        choosePixel(next);
                        cellRefs.current[next]?.focus();
                      }}
                    >
                      <span>{step >= 2 ? cell.code : ''}</span>
                      {step === 3 && <small>#{index + 1}</small>}
                    </button>
                  );
                })}
              </section>
            </div>
            <p className="image-board-caption">
              {step === 3
                ? 'Scan direction: → across each row, then ↓ to the next row.'
                : 'One square = one pixel. Select a square, or use the arrow keys.'}
            </p>
            <section
              className="image-pixel-readout"
              aria-label="Selected pixel"
            >
              <span
                className="image-colour-chip"
                style={{ background: colour.hex }}
              />
              <div>
                <span>
                  Pixel {selected + 1} · row {pixel.y + 1}, column {pixel.x + 1}
                </span>
                <strong>
                  {colour.name}
                  {step >= 2 && (
                    <>
                      {' '}
                      <ArrowRight size={16} /> <code>{pixel.code}</code>
                    </>
                  )}
                </strong>
              </div>
              {step >= 2 && <span>{bits} bits</span>}
            </section>
          </section>
          {step !== 3 && (
            <aside
              className="image-explanation"
              aria-label="Current image concept"
            >
              {step === 0 && (
                <>
                  <p className="studio-kicker">Look closely</p>
                  <h3>
                    Many little squares.
                    <br />
                    One complete image.
                  </h3>
                  <p>
                    The selected square is one pixel. It does not hold a whole
                    shape or object — only a colour.
                  </p>
                  <div
                    className="image-magnified"
                    style={{ background: colour.hex, color: colour.ink }}
                  >
                    <span>1 pixel</span>
                    <strong>{colour.name}</strong>
                  </div>
                  <p className="image-note">
                    This is a tiny test bitmap so every square is easy to count.
                  </p>
                </>
              )}
              {step === 1 && (
                <>
                  <p className="studio-kicker">Image resolution</p>
                  <div className="image-calculation">
                    <strong>
                      {width} × {height}
                    </strong>
                    <span>= {model.pixels.length} pixels</span>
                  </div>
                  <div className="image-settings">
                    <label>
                      Width
                      <select
                        aria-label="Image width"
                        value={width}
                        onChange={(e) => configure(Number(e.target.value))}
                      >
                        {[2, 4, 6, 8].map((n) => (
                          <option key={n} value={n}>
                            {n} pixels
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Height
                      <select
                        aria-label="Image height"
                        value={height}
                        onChange={(e) =>
                          configure(width, Number(e.target.value))
                        }
                      >
                        {[2, 4, 6, 8].map((n) => (
                          <option key={n} value={n}>
                            {n} pixels
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p>
                    Each row has {width} pixels. There are {height} rows.
                    Multiply them to count the entire grid.
                  </p>
                  <p className="image-note">
                    Try doubling just the width. The total number of pixels
                    doubles too.
                  </p>
                </>
              )}
              {step >= 2 && (
                <>
                  <div className="image-settings">
                    <label>
                      Colour depth
                      <select
                        aria-label="Image colour depth"
                        value={bits}
                        onChange={(e) =>
                          configure(width, height, Number(e.target.value))
                        }
                      >
                        {[1, 2, 3].map((b) => (
                          <option key={b} value={b}>
                            {b} {b === 1 ? 'bit' : 'bits'} per pixel
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p>
                    <strong>
                      {bits} bits → up to {2 ** bits} colours
                    </strong>
                    <br />
                    <span className="studio-meta">
                      {model.usedColours} colours used in this image
                    </span>
                  </p>
                  <ul className="image-codebook" aria-label="Colour code table">
                    {model.palette.map((c) => (
                      <li
                        key={c.index}
                        className={
                          c.index === pixel.colourIndex
                            ? 'image-code-current'
                            : ''
                        }
                      >
                        <span
                          className="image-colour-chip"
                          style={{ background: c.hex }}
                        />
                        <span>{c.name}</span>
                        <code>{c.code}</code>
                      </li>
                    ))}
                  </ul>
                  <p className="image-note">
                    Same colour, same code. Every {colour.name.toLowerCase()}{' '}
                    pixel uses <code>{colour.code}</code>.
                  </p>
                </>
              )}
            </aside>
          )}
        </div>
        {step === 3 && (
          <section
            className="image-sequence-panel"
            aria-label="Pixel encoding sequence"
          >
            <div className="studio-row">
              <div>
                <h3>One pixel after another.</h3>
                <p>
                  {scanned} / {model.pixels.length} pixels stored ·{' '}
                  {scanned * bits} bits so far
                </p>
              </div>
              <div className="image-scan-tools">
                <Button
                  variant="outline"
                  disabled={scanned === model.pixels.length && !playing}
                  onClick={nextPixel}
                >
                  <SkipForward />
                  Next pixel
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    if (playing) setPlaying(false);
                    else {
                      if (scanned === model.pixels.length) setScanned(0);
                      setPlaying(true);
                    }
                  }}
                >
                  {playing ? <Pause /> : <Play />}
                  {playing ? 'Pause scan' : 'Scan pixels'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPlaying(false);
                    setScanned(model.pixels.length);
                    setSelected(model.pixels.length - 1);
                    setStatus('Complete pixel sequence shown.');
                  }}
                >
                  Show all
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPlaying(false);
                    setScanned(0);
                    setSelected(0);
                    setStatus('Scan restarted.');
                  }}
                >
                  Restart scan
                </Button>
              </div>
            </div>
            <ol
              className="image-sequence-tape"
              aria-label="Ordered pixel codes"
            >
              {model.pixels.map((cell) => (
                <li key={cell.index}>
                  <button
                    aria-pressed={selected === cell.index}
                    aria-label={`Sequence pixel ${cell.index + 1}${cell.index < scanned ? `, code ${cell.code}` : ', not yet stored'}`}
                    onClick={() => choosePixel(cell.index)}
                  >
                    <small>#{cell.index + 1}</small>
                    <span
                      className="image-colour-chip"
                      style={{
                        background: model.palette[cell.colourIndex].hex,
                      }}
                    />
                    <code>
                      {cell.index < scanned ? cell.code : '·'.repeat(bits)}
                    </code>
                  </button>
                  {(cell.index + 1) % width === 0 &&
                    cell.index < model.pixels.length - 1 && (
                      <span className="image-row-break">
                        Row {cell.y + 1} ends ↵
                      </span>
                    )}
                </li>
              ))}
            </ol>
            <div className="image-raw-stream">
              <span>Binary sequence</span>
              <code>
                {model.sequence.slice(0, scanned * bits) ||
                  'Press Next pixel or Scan pixels to begin.'}
              </code>
            </div>
            <p className="image-note">
              Pixel labels, coloured squares and row markers are guides, not
              extra stored bits. The codes are joined without spaces.
            </p>
            <div className="image-size-formula">
              <strong>
                {width} × {height} pixels × {bits} bits = {model.totalBits} bits
              </strong>
              <span>
                Theoretical uncompressed pixel data · {model.packedBytes} packed{' '}
                {model.packedBytes === 1 ? 'byte' : 'bytes'}
                {model.totalBits % 8
                  ? ` (including ${8 - (model.totalBits % 8)} padding bits)`
                  : ''}
              </span>
            </div>
          </section>
        )}
        <footer className="image-lesson-navigation">
          <Button
            variant="outline"
            disabled={step === 0}
            onClick={() => changeStep(step - 1)}
          >
            <ArrowLeft />
            Previous stage
          </Button>
          <output>{status}</output>
          <Button
            variant="accent"
            disabled={step === 3}
            onClick={() => changeStep(step + 1)}
          >
            Next stage
            <ArrowRight />
          </Button>
        </footer>
      </div>
    </StudioLayout>
  );
}
