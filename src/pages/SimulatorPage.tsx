import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Binary,
  Brush,
  Check,
  Eye,
  Grid3X3,
  Image as ImageIcon,
  Info,
  Link2,
  Lock,
  Maximize2,
  Minimize2,
  Palette as PaletteIcon,
  Redo2,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  Undo2,
  Unlock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BeadCanvas, type CanvasMode } from '@/src/components/BeadCanvas';
import { PageHeader } from '@/src/components/PageHeader';
import { sectionRoute } from '@/src/data/syllabus';
import {
  areaAverageResample,
  binaryCode,
  calculateImageMetrics,
  countUsedColours,
  createDeterministicPalette,
  DEFAULT_BPP,
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  extractCanonicalCrop,
  maximumColours,
  quantiseToPalette,
  rgbToHex,
  type RGB,
} from '@/src/lib/imageMath';

interface StrokeChange {
  index: number;
  before: number;
  after: number;
}

type Stroke = StrokeChange[];
type LessonStep = 1 | 2 | 3 | 4;

const resolutionPresets = [8, 16, 32, 48, 64];
const imageUrl = `${import.meta.env.BASE_URL}assets/mona-lisa-beads.png`;
interface SourcePaletteCache {
  samples: RGB[];
  palettes: Map<number, RGB[]>;
}

const paletteCache = new WeakMap<ImageData, SourcePaletteCache>();

function getCachedPalette(source: ImageData, bitsPerPixel: number): RGB[] {
  let sourceCache = paletteCache.get(source);
  if (!sourceCache) {
    sourceCache = {
      samples: areaAverageResample(source, 50, 50),
      palettes: new Map(),
    };
    paletteCache.set(source, sourceCache);
  }
  const cached = sourceCache.palettes.get(bitsPerPixel);
  if (cached) return cached;
  const palette = createDeterministicPalette(
    sourceCache.samples,
    maximumColours(bitsPerPixel),
  );
  sourceCache.palettes.set(bitsPerPixel, palette);
  return palette;
}

function scalarSliderValue(value: number | readonly number[]): number {
  return typeof value === 'number' ? value : (value[0] ?? 0);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-GB').format(value);
}

function formatRawSize(bytes: number): string {
  if (bytes >= 1024)
    return `${(bytes / 1024).toFixed(bytes % 1024 === 0 ? 0 : 2)} KiB`;
  return `${formatNumber(bytes)} bytes`;
}

export function SimulatorPage() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [bitsPerPixel, setBitsPerPixel] = useState(DEFAULT_BPP);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [mode, setMode] = useState<CanvasMode>('inspect');
  const [paintIndex, setPaintIndex] = useState(0);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [sourceData, setSourceData] = useState<ImageData | null>(null);
  const [imageStatus, setImageStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [baseIndices, setBaseIndices] = useState<Uint8Array<ArrayBufferLike>>(
    () => new Uint8Array(),
  );
  const [workingIndices, setWorkingIndices] = useState<
    Uint8Array<ArrayBufferLike>
  >(() => new Uint8Array());
  const [undoStack, setUndoStack] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [lessonStep, setLessonStep] = useState<LessonStep>(1);
  const [lessonView, setLessonView] = useState<'guided' | 'free'>('guided');
  const [statusMessage, setStatusMessage] = useState(
    'Loading the reference image…',
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  const simulatorRef = useRef<HTMLElement>(null);
  const lessonTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const paletteSwatchRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const workingRef = useRef<Uint8Array<ArrayBufferLike>>(workingIndices);
  const activeStroke = useRef(new Map<number, number>());
  const hasBuiltBoard = useRef(false);

  useEffect(() => {
    document.title = 'Pixel Bead Simulator · Gregg’s IGCSE CS Playground';
  }, []);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      try {
        const data = extractCanonicalCrop(image);
        setSourceData(data);
        setImageStatus('ready');
        setStatusMessage('Reference ready. Select a bead to inspect it.');
      } catch {
        setImageStatus('error');
        setStatusMessage('The browser could not prepare the reference image.');
      }
    };
    image.onerror = () => {
      if (cancelled) return;
      setImageStatus('error');
      setStatusMessage('The reference image could not be loaded.');
    };
    image.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

  const palette = useMemo(() => {
    if (!sourceData) return [];
    return getCachedPalette(sourceData, bitsPerPixel);
  }, [bitsPerPixel, sourceData]);

  useLayoutEffect(() => {
    if (!sourceData || palette.length === 0) return;
    const samples = areaAverageResample(sourceData, width, height);
    const nextBase = quantiseToPalette(samples, palette);
    const nextWorking = nextBase.slice();
    setBaseIndices(nextBase);
    workingRef.current = nextWorking;
    setWorkingIndices(nextWorking);
    setSelectedCell(null);
    setPaintIndex((current) => Math.min(current, palette.length - 1));
    setUndoStack([]);
    setRedoStack([]);
    setIsDirty(false);
    if (hasBuiltBoard.current) {
      setStatusMessage(
        `Board rebuilt from the original reference at ${width} × ${height}, ${bitsPerPixel} bpp.`,
      );
    }
    hasBuiltBoard.current = true;
  }, [bitsPerPixel, height, palette, sourceData, width]);

  const metrics = calculateImageMetrics(width, height, bitsPerPixel);
  const usedColours = useMemo(
    () => countUsedColours(workingIndices),
    [workingIndices],
  );
  const selectedPaletteIndex =
    selectedCell === null ? null : (workingIndices[selectedCell] ?? null);
  const selectedColour =
    selectedPaletteIndex === null ? null : palette[selectedPaletteIndex];

  const beginStroke = useCallback(() => {
    activeStroke.current = new Map();
  }, []);

  const paintCell = useCallback(
    (index: number) => {
      const current = workingRef.current;
      if (index < 0 || index >= current.length || current[index] === paintIndex)
        return;
      if (!activeStroke.current.has(index))
        activeStroke.current.set(index, current[index]);
      const next = current.slice();
      next[index] = paintIndex;
      workingRef.current = next;
      setWorkingIndices(next);
    },
    [paintIndex],
  );

  const finishStroke = useCallback(() => {
    const changes = [...activeStroke.current.entries()]
      .map(([index, before]) => ({
        index,
        before,
        after: workingRef.current[index],
      }))
      .filter((change) => change.before !== change.after);
    activeStroke.current.clear();
    if (changes.length === 0) return;
    setUndoStack((current) => [...current.slice(-49), changes]);
    setRedoStack([]);
    setIsDirty(
      workingRef.current.some((value, index) => value !== baseIndices[index]),
    );
    setStatusMessage(
      `${changes.length} bead${changes.length === 1 ? '' : 's'} painted. Press Ctrl or Command + Z to undo.`,
    );
  }, [baseIndices]);

  const applyStroke = useCallback(
    (stroke: Stroke, direction: 'undo' | 'redo') => {
      const next = workingRef.current.slice();
      stroke.forEach((change) => {
        next[change.index] =
          direction === 'undo' ? change.before : change.after;
      });
      workingRef.current = next;
      setWorkingIndices(next);
      setIsDirty(next.some((value, index) => value !== baseIndices[index]));
    },
    [baseIndices],
  );

  const undo = useCallback(() => {
    const stroke = undoStack.at(-1);
    if (!stroke) return;
    applyStroke(stroke, 'undo');
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack([...redoStack, stroke]);
    setStatusMessage('Last paint stroke undone.');
  }, [applyStroke, redoStack, undoStack]);

  const redo = useCallback(() => {
    const stroke = redoStack.at(-1);
    if (!stroke) return;
    applyStroke(stroke, 'redo');
    setRedoStack(redoStack.slice(0, -1));
    setUndoStack([...undoStack, stroke]);
    setStatusMessage('Paint stroke restored.');
  }, [applyStroke, redoStack, undoStack]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z')
        return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [redo, undo]);

  const restoreImage = () => {
    const restored = baseIndices.slice();
    workingRef.current = restored;
    setWorkingIndices(restored);
    setSelectedCell(null);
    setUndoStack([]);
    setRedoStack([]);
    setIsDirty(false);
    setStatusMessage(
      'Artwork restored from the reference at the current settings.',
    );
  };

  const resetDemo = () => {
    setWidth(DEFAULT_WIDTH);
    setHeight(DEFAULT_HEIGHT);
    setBitsPerPixel(DEFAULT_BPP);
    setAspectLocked(true);
    setMode('inspect');
    setPaintIndex(0);
    setLessonStep(1);
    setLessonView('guided');
    setStatusMessage('Demo reset to 32 × 32 pixels and 4 bpp.');
    if (
      width === DEFAULT_WIDTH &&
      height === DEFAULT_HEIGHT &&
      bitsPerPixel === DEFAULT_BPP
    )
      restoreImage();
  };

  const retryImage = () => {
    setImageStatus('loading');
    setStatusMessage('Loading the reference image…');
    setLoadAttempt((value) => value + 1);
  };

  const changeWidth = (next: number) => {
    setWidth(next);
    if (aspectLocked) setHeight(next);
  };

  const changeHeight = (next: number) => {
    setHeight(next);
    if (aspectLocked) setWidth(next);
  };

  const toggleAspectLock = () => {
    const nextLocked = !aspectLocked;
    if (nextLocked && width !== height) setHeight(width);
    setAspectLocked(nextLocked);
  };

  const applyPreset = (
    nextWidth: number,
    nextHeight: number,
    nextBits: number,
    message: string,
  ) => {
    setWidth(nextWidth);
    setHeight(nextHeight);
    setBitsPerPixel(nextBits);
    setStatusMessage(message);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await simulatorRef.current?.requestFullscreen();
    } catch {
      setStatusMessage('Fullscreen is not available in this browser.');
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === simulatorRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleLessonKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    step: LessonStep,
  ) => {
    let nextStep = step;
    if (event.key === 'ArrowLeft')
      nextStep = Math.max(1, step - 1) as LessonStep;
    if (event.key === 'ArrowRight')
      nextStep = Math.min(4, step + 1) as LessonStep;
    if (event.key === 'Home') nextStep = 1;
    if (event.key === 'End') nextStep = 4;
    if (nextStep === step) return;
    event.preventDefault();
    setLessonStep(nextStep);
    lessonTabRefs.current[nextStep - 1]?.focus();
  };

  const handlePaletteKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex = index;
    if (event.key === 'ArrowLeft') nextIndex = Math.max(0, index - 1);
    if (event.key === 'ArrowRight')
      nextIndex = Math.min(palette.length - 1, index + 1);
    if (event.key === 'ArrowUp') nextIndex = Math.max(0, index - 8);
    if (event.key === 'ArrowDown')
      nextIndex = Math.min(palette.length - 1, index + 8);
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = palette.length - 1;
    if (nextIndex === index) return;
    event.preventDefault();
    setPaintIndex(nextIndex);
    setMode('paint');
    paletteSwatchRefs.current[nextIndex]?.focus();
  };

  const selectedX = selectedCell === null ? null : selectedCell % width;
  const selectedY =
    selectedCell === null ? null : Math.floor(selectedCell / width);

  return (
    <main className="page-wrap simulator-page" ref={simulatorRef}>
      <PageHeader
        eyebrow={
          <>
            <PaletteIcon /> Image representation{' '}
            <Badge variant="secondary">Topic 1.2</Badge>
          </>
        }
        title="Pixel Bead Simulator"
        description="Change the number of pixels and bits per pixel. Watch spatial detail, available colours and theoretical file size respond in real time."
        breadcrumbs={[
          { label: '1.2 Text, sound and images', route: sectionRoute },
          { label: 'Pixel Bead Simulator' },
        ]}
        action={
          <Button variant="outline" size="lg" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 /> : <Maximize2 />}
            {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </Button>
        }
      />

      <div className="metrics-strip" aria-label="Current image data">
        <div>
          <span>Resolution</span>
          <strong>
            {width} × {height}
          </strong>
          <small>pixel dimensions</small>
        </div>
        <div>
          <span>Total pixels</span>
          <strong>{formatNumber(metrics.totalPixels)}</strong>
          <small>
            {width} × {height}
          </small>
        </div>
        <div>
          <span>Colour depth</span>
          <strong>{bitsPerPixel} bpp</strong>
          <small>bits per pixel</small>
        </div>
        <div>
          <span>Maximum colours</span>
          <strong>{formatNumber(metrics.maximumColours)}</strong>
          <small>{formatNumber(usedColours)} used now</small>
        </div>
        <div className="size-metric">
          <span>Raw pixel data</span>
          <strong>{formatRawSize(metrics.rawBytes)}</strong>
          <small>{formatNumber(metrics.rawBits)} bits</small>
        </div>
      </div>

      <div className="simulator-grid">
        <section
          className="visual-lab"
          aria-label="Reference and simulated image comparison"
        >
          <div className="visual-pair">
            <article className="image-panel">
              <div className="panel-heading">
                <span>Reference image</span>
                <Badge variant="outline">Original</Badge>
              </div>
              <div className="image-frame reference-frame">
                <img
                  src={imageUrl}
                  alt="A Mona Lisa-inspired portrait made from coloured building blocks"
                />
                <span className="sample-boundary" aria-hidden="true">
                  <b>sampled area</b>
                </span>
              </div>
              <p className="fine-print">
                The complete source is shown. Its white frame and transparent
                corners are excluded from sampling.
              </p>
            </article>

            <article className="image-panel">
              <div className="panel-heading">
                <span>Bead simulation</span>
                <Badge>
                  {width} × {height}
                </Badge>
              </div>
              <div className="canvas-frame">
                {imageStatus === 'ready' && workingIndices.length > 0 ? (
                  <BeadCanvas
                    width={width}
                    height={height}
                    palette={palette}
                    indices={workingIndices}
                    mode={mode}
                    paintIndex={paintIndex}
                    selectedCell={selectedCell}
                    onSelectCell={setSelectedCell}
                    onBeginStroke={beginStroke}
                    onPaintCell={paintCell}
                    onFinishStroke={finishStroke}
                  />
                ) : imageStatus === 'error' ? (
                  <div className="canvas-state">
                    <ImageIcon />
                    <strong>Reference unavailable</strong>
                    <span>Check the image asset, then try again.</span>
                    <Button variant="outline" onClick={retryImage}>
                      <RefreshCcw /> Retry
                    </Button>
                  </div>
                ) : (
                  <div className="canvas-state">
                    <span className="loading-bead" />
                    <strong>Building the palette…</strong>
                  </div>
                )}
              </div>
              <p className="fine-print">
                The display size stays fixed, so fewer pixels become visibly
                larger.
              </p>
            </article>
          </div>

          <div className="pixel-inspector" aria-live="polite">
            <div className="inspector-title">
              <Eye />
              <span>
                <strong>Pixel inspector</strong>
                <small>
                  {selectedCell === null
                    ? 'Select any bead on the board.'
                    : 'One bead = one pixel.'}
                </small>
              </span>
            </div>
            {selectedCell !== null &&
            selectedColour &&
            selectedPaletteIndex !== null ? (
              <div className="inspector-values">
                <span>
                  <small>Coordinate</small>
                  <strong>
                    ({selectedX}, {selectedY})
                  </strong>
                </span>
                <span>
                  <small>Palette index</small>
                  <strong>{selectedPaletteIndex}</strong>
                </span>
                <span>
                  <small>Example {bitsPerPixel}-bit code</small>
                  <strong className="binary-value">
                    {binaryCode(selectedPaletteIndex, bitsPerPixel)}
                  </strong>
                </span>
                <span>
                  <small>Colour</small>
                  <strong>
                    <i style={{ background: rgbToHex(selectedColour) }} />
                    {rgbToHex(selectedColour)}
                  </strong>
                </span>
              </div>
            ) : (
              <p>
                Use Inspect mode and click a bead to reveal its coordinate,
                palette entry and binary index.
              </p>
            )}
          </div>
        </section>

        <aside className="controls-panel" aria-label="Simulator controls">
          <div className="control-section mode-section">
            <div className="control-title">
              <span>Tool</span>
              {isDirty && <Badge variant="outline">Edited</Badge>}
            </div>
            <fieldset className="mode-switch">
              <legend className="sr-only">Board tool</legend>
              <Button
                variant={mode === 'inspect' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setMode('inspect')}
                aria-pressed={mode === 'inspect'}
              >
                <Eye /> Inspect
              </Button>
              <Button
                variant={mode === 'paint' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setMode('paint')}
                aria-pressed={mode === 'paint'}
              >
                <Brush /> Paint
              </Button>
            </fieldset>
            {mode === 'paint' && (
              <Alert className="paint-warning">
                <Info />
                <AlertTitle>Paint mode is on</AlertTitle>
                <AlertDescription>
                  Changing resolution or colour depth rebuilds the board and
                  clears paint edits.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="control-section">
            <div className="control-title">
              <span>Image resolution</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAspectLock}
                aria-pressed={aspectLocked}
              >
                {aspectLocked ? <Lock /> : <Unlock />}
                {aspectLocked ? 'Linked' : 'Independent'}
              </Button>
            </div>
            <div className="slider-control">
              <label htmlFor="width-slider">
                <span>Width</span>
                <output>{width} px</output>
              </label>
              <Slider
                id="width-slider"
                min={8}
                max={64}
                step={4}
                value={[width]}
                onValueChange={(value) => changeWidth(scalarSliderValue(value))}
                aria-label="Image width in pixels"
              />
            </div>
            <div className="slider-control">
              <label htmlFor="height-slider">
                <span>Height</span>
                <output>{height} px</output>
              </label>
              <Slider
                id="height-slider"
                min={8}
                max={64}
                step={4}
                value={[height]}
                onValueChange={(value) =>
                  changeHeight(scalarSliderValue(value))
                }
                aria-label="Image height in pixels"
                disabled={aspectLocked}
              />
            </div>
            <div className="preset-row" aria-label="Square resolution presets">
              {resolutionPresets.map((preset) => (
                <Button
                  key={preset}
                  variant={
                    width === preset && height === preset
                      ? 'secondary'
                      : 'ghost'
                  }
                  size="sm"
                  onClick={() =>
                    applyPreset(
                      preset,
                      preset,
                      bitsPerPixel,
                      `Resolution set to ${preset} × ${preset}.`,
                    )
                  }
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <div className="control-title">
              <span>Colour depth</span>
              <strong>{bitsPerPixel} bpp</strong>
            </div>
            <div className="slider-control">
              <label htmlFor="bpp-slider">
                <span>Bits per pixel</span>
                <output>
                  {formatNumber(maximumColours(bitsPerPixel))} colours
                </output>
              </label>
              <Slider
                id="bpp-slider"
                min={1}
                max={8}
                step={1}
                value={[bitsPerPixel]}
                onValueChange={(value) =>
                  setBitsPerPixel(scalarSliderValue(value))
                }
                aria-label="Colour depth in bits per pixel"
              />
              <div className="slider-ticks" aria-hidden="true">
                {Array.from({ length: 8 }, (_, index) => (
                  <span key={index}>{index + 1}</span>
                ))}
              </div>
            </div>
            <details className="true-colour-note">
              <summary>
                <Sparkles /> What about 24-bit True Colour?
              </summary>
              <p>
                <strong>
                  24 bpp = 8 bits for red + 8 for green + 8 for blue.
                </strong>{' '}
                It can represent 2<sup>24</sup> = 16,777,216 colours. At {width}{' '}
                × {height}, its raw pixel data would be{' '}
                {formatRawSize(Math.ceil((width * height * 24) / 8))}.
              </p>
            </details>
          </div>

          <div className="control-section palette-section">
            <div className="control-title">
              <span>Available palette</span>
              <Badge variant="outline">{palette.length} swatches</Badge>
            </div>
            <div
              className="palette-grid"
              aria-label={`${palette.length} available colours`}
            >
              {palette.map((colour, index) => (
                <button
                  key={`${rgbToHex(colour)}-${index}`}
                  ref={(node) => {
                    paletteSwatchRefs.current[index] = node;
                  }}
                  type="button"
                  aria-pressed={paintIndex === index}
                  aria-label={`Palette ${index}, code ${binaryCode(index, bitsPerPixel)}, ${rgbToHex(colour)}`}
                  title={`${binaryCode(index, bitsPerPixel)} · ${rgbToHex(colour)}`}
                  className={
                    paintIndex === index
                      ? 'palette-swatch palette-swatch-selected'
                      : 'palette-swatch'
                  }
                  style={{ background: rgbToHex(colour) }}
                  tabIndex={paintIndex === index ? 0 : -1}
                  onClick={() => {
                    setPaintIndex(index);
                    setMode('paint');
                  }}
                  onKeyDown={(event) => handlePaletteKeyDown(event, index)}
                >
                  {paintIndex === index && <Check />}
                </button>
              ))}
            </div>
            <p className="palette-help">
              Choose a swatch, then click or drag across the board. The binary
              code is a palette index in this teaching model.
            </p>
          </div>

          <div className="history-actions">
            <Button
              variant="outline"
              size="lg"
              onClick={undo}
              disabled={undoStack.length === 0}
            >
              <Undo2 /> Undo
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={redo}
              disabled={redoStack.length === 0}
            >
              <Redo2 /> Redo
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={restoreImage}
              disabled={!isDirty}
            >
              <RotateCcw /> Restore image
            </Button>
            <Button variant="ghost" size="lg" onClick={resetDemo}>
              <RefreshCcw /> Reset demo
            </Button>
          </div>
        </aside>
      </div>

      <p className="sr-only" aria-live="polite">
        {statusMessage}
      </p>

      <section className="lesson-section" aria-labelledby="lesson-title">
        <div className="lesson-header">
          <div>
            <p className="section-kicker">Teach with the lab</p>
            <h2 id="lesson-title">Four ideas, one image</h2>
          </div>
          <fieldset className="view-switch">
            <legend className="sr-only">Lesson view</legend>
            <Button
              variant={lessonView === 'guided' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setLessonView('guided')}
            >
              Guided lesson
            </Button>
            <Button
              variant={lessonView === 'free' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setLessonView('free')}
            >
              Free explore
            </Button>
          </fieldset>
        </div>
        {lessonView === 'guided' ? (
          <div className="guided-lesson">
            <div
              className="lesson-steps"
              role="tablist"
              aria-label="Guided lesson steps"
            >
              {([1, 2, 3, 4] as LessonStep[]).map((step) => (
                <button
                  key={step}
                  ref={(node) => {
                    lessonTabRefs.current[step - 1] = node;
                  }}
                  id={`lesson-tab-${step}`}
                  role="tab"
                  aria-controls="lesson-panel"
                  aria-selected={lessonStep === step}
                  tabIndex={lessonStep === step ? 0 : -1}
                  className={
                    lessonStep === step
                      ? 'lesson-step lesson-step-active'
                      : 'lesson-step'
                  }
                  onClick={() => setLessonStep(step)}
                  onKeyDown={(event) => handleLessonKeyDown(event, step)}
                >
                  <span>{step}</span>
                  {
                    ['Pixel', 'Resolution', 'Colour depth', 'File size'][
                      step - 1
                    ]
                  }
                </button>
              ))}
            </div>
            <div
              className="lesson-content"
              id="lesson-panel"
              role="tabpanel"
              aria-labelledby={`lesson-tab-${lessonStep}`}
            >
              {lessonStep === 1 && (
                <>
                  <div className="lesson-icon">
                    <Grid3X3 />
                  </div>
                  <div>
                    <p className="section-kicker">Step 1 · Pixel</p>
                    <h3>Zoom in to the smallest picture element.</h3>
                    <p>
                      A pixel is the smallest addressable picture element in a
                      raster image. In this simulator, one bead represents one
                      pixel. Select a bead and inspect its coordinate and stored
                      palette code.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => {
                        applyPreset(
                          16,
                          16,
                          3,
                          'Pixel lesson ready. Select one bead.',
                        );
                        setMode('inspect');
                      }}
                    >
                      Set up pixel view <Eye />
                    </Button>
                  </div>
                </>
              )}
              {lessonStep === 2 && (
                <>
                  <div className="lesson-icon">
                    <Grid3X3 />
                  </div>
                  <div>
                    <p className="section-kicker">Step 2 · Image resolution</p>
                    <h3>More pixels can represent more spatial detail.</h3>
                    <p>
                      Resolution here means the pixel dimensions: width ×
                      height. Keep colour depth fixed at 4 bpp, then compare the
                      two boards. This is not PPI or DPI.
                    </p>
                    <div className="lesson-buttons">
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() =>
                          applyPreset(
                            8,
                            8,
                            4,
                            'Low-resolution example: 8 × 8 at 4 bpp.',
                          )
                        }
                      >
                        Low · 8 × 8
                      </Button>
                      <Button
                        size="lg"
                        onClick={() =>
                          applyPreset(
                            48,
                            48,
                            4,
                            'High-resolution example: 48 × 48 at 4 bpp.',
                          )
                        }
                      >
                        High · 48 × 48
                      </Button>
                    </div>
                  </div>
                </>
              )}
              {lessonStep === 3 && (
                <>
                  <div className="lesson-icon">
                    <PaletteIcon />
                  </div>
                  <div>
                    <p className="section-kicker">Step 3 · Colour depth</p>
                    <h3>Each extra bit doubles the available colours.</h3>
                    <p>
                      At a fixed 32 × 32 resolution, compare 1 bpp (up to 2
                      colours) with 8 bpp (up to 256). Colour depth changes
                      colour choice—not the number of pixels.
                    </p>
                    <div className="lesson-buttons">
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() =>
                          applyPreset(
                            32,
                            32,
                            1,
                            'Low colour-depth example: 1 bpp.',
                          )
                        }
                      >
                        1 bpp · 2 colours
                      </Button>
                      <Button
                        size="lg"
                        onClick={() =>
                          applyPreset(
                            32,
                            32,
                            8,
                            'High colour-depth example: 8 bpp.',
                          )
                        }
                      >
                        8 bpp · 256 colours
                      </Button>
                    </div>
                  </div>
                </>
              )}
              {lessonStep === 4 && (
                <>
                  <div className="lesson-icon">
                    <Binary />
                  </div>
                  <div>
                    <p className="section-kicker">Step 4 · File size</p>
                    <h3>Pixels × bits per pixel = raw image data.</h3>
                    <p>
                      Different choices can produce the same theoretical size:
                      16 × 16 × 8 bpp and 32 × 32 × 2 bpp both equal 2,048 bits,
                      or 256 bytes.
                    </p>
                    <div className="lesson-buttons">
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() =>
                          applyPreset(
                            16,
                            16,
                            8,
                            '256 pixels × 8 bpp = 2,048 bits.',
                          )
                        }
                      >
                        16² × 8 bpp
                      </Button>
                      <Button
                        size="lg"
                        onClick={() =>
                          applyPreset(
                            32,
                            32,
                            2,
                            '1,024 pixels × 2 bpp = 2,048 bits.',
                          )
                        }
                      >
                        32² × 2 bpp
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="free-explore-card">
            <Link2 />
            <div>
              <h3>Choose your own test.</h3>
              <p>
                Keep one variable fixed, change the other, then use the live
                metrics and image comparison to explain what happened.
              </p>
            </div>
            <a
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
              href="#top"
              onClick={(event) => {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Back to controls
            </a>
          </div>
        )}
      </section>

      <section
        className="concept-grid"
        aria-label="Image representation definitions"
      >
        <Card>
          <CardHeader>
            <span className="concept-number">01</span>
            <CardTitle>Pixel</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The smallest addressable picture element in a raster image.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <span className="concept-number">02</span>
            <CardTitle>Image resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              The pixel dimensions of an image. Total pixels = width × height.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <span className="concept-number">03</span>
            <CardTitle>Colour depth</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              The number of bits used to represent the colour of each pixel.
              Maximum colours = 2<sup>bpp</sup>.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <span className="concept-number">04</span>
            <CardTitle>Theoretical size</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Width × height × colour depth gives raw pixel-data bits.</p>
          </CardContent>
        </Card>
      </section>

      <Alert className="accuracy-note">
        <Info />
        <AlertTitle>Exam model versus a real file</AlertTitle>
        <AlertDescription>
          This demo calculates theoretical raw, uncompressed pixel data. A real
          PNG or JPEG also contains headers and metadata, and its actual size is
          affected by compression, palette storage and transparency. Increasing
          resolution or colour depth can improve fidelity to the same source,
          but it cannot recover detail that was never captured.
        </AlertDescription>
      </Alert>
    </main>
  );
}
