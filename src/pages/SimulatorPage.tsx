/* eslint-disable jsx-a11y/prefer-tag-over-role -- Palette swatches use button interaction with radiogroup selection semantics. */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  ArrowLeft,
  Brush,
  Check,
  Eye,
  Image as ImageIcon,
  Info,
  Lock,
  Maximize2,
  Menu,
  Minimize2,
  Palette as PaletteIcon,
  Redo2,
  RefreshCcw,
  RotateCcw,
  Settings2,
  Sparkles,
  Undo2,
  Unlock,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useAppShell } from '@/src/components/AppShell';
import { BeadCanvas, type CanvasMode } from '@/src/components/BeadCanvas';
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
type WorkspaceView = 'explore' | 'guided';
type MobileStageView = 'simulation' | 'compare';

interface SourcePaletteCache {
  samples: RGB[];
  palettes: Map<number, RGB[]>;
}

interface MetricFormulaProps {
  width: number;
  height: number;
  bitsPerPixel: number;
  totalPixels: number;
  rawBits: number;
  rawBytes: number;
  maximumColourCount: number;
  usedColours: number;
}

interface LabDialogProps {
  children: ReactNode;
  className?: string;
  labelledBy: string;
  onDismiss: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

const resolutionPresets = [8, 16, 32, 48, 64];
const imageUrl = `${import.meta.env.BASE_URL}assets/mona-lisa-beads.png`;
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
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(bytes % 1024 === 0 ? 0 : 2)} KiB`;
  }
  return `${formatNumber(bytes)} bytes`;
}

function isDarkColour(colour: RGB): boolean {
  const linearise = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * linearise(colour.r) +
    0.7152 * linearise(colour.g) +
    0.0722 * linearise(colour.b);
  return luminance < 0.3;
}

function useMobileWorkbench(): boolean {
  const query = '(max-width: 639px)';
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return matches;
}

function MetricFormula({
  width,
  height,
  bitsPerPixel,
  totalPixels,
  rawBits,
  rawBytes,
  maximumColourCount,
  usedColours,
}: MetricFormulaProps) {
  return (
    <div
      className="metrics-strip metric-formula"
      aria-label="Current image data"
    >
      <div className="metric-formula-primary">
        <span className="metric-factor">
          <strong>
            {width} × {height}
          </strong>{' '}
          = {formatNumber(totalPixels)} pixels
        </span>
        <span className="metric-operator" aria-hidden="true">
          ×
        </span>
        <span className="metric-factor">
          <strong>{bitsPerPixel} bits</strong>
          <span className="sr-only"> ({bitsPerPixel} bpp)</span> ={' '}
          {formatNumber(rawBits)} bits
        </span>
        <span className="metric-operator" aria-hidden="true">
          =
        </span>
        <strong className="metric-result">{formatRawSize(rawBytes)}</strong>
      </div>
      <div className="metric-formula-colours">
        <strong>
          2<sup>{bitsPerPixel}</sup> = {formatNumber(maximumColourCount)}
        </strong>
        <span>maximum colours</span>
        <span aria-hidden="true">·</span>
        <strong>{formatNumber(usedColours)}</strong> used
      </div>
    </div>
  );
}

function LabDialog({
  children,
  className = '',
  labelledBy,
  onDismiss,
  returnFocusRef,
}: LabDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const returnFocusElement = returnFocusRef?.current;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');

    return () => {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
      returnFocusElement?.focus();
    };
  }, [returnFocusRef]);

  return (
    <dialog
      ref={dialogRef}
      className={`lab-dialog ${className}`.trim()}
      aria-labelledby={labelledBy}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
    >
      {children}
    </dialog>
  );
}

export function SimulatorPage() {
  const { navigationOpen, openNavigation } = useAppShell();
  const isMobileWorkbench = useMobileWorkbench();
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
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('explore');
  const [lessonStep, setLessonStep] = useState<LessonStep>(1);
  const [mobileStageView, setMobileStageView] =
    useState<MobileStageView>('simulation');
  const [statusMessage, setStatusMessage] = useState(
    'Loading the reference image…',
  );
  const [statusRevision, setStatusRevision] = useState(0);
  const [statusVisible, setStatusVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);

  const workbenchRef = useRef<HTMLElement>(null);
  const lessonTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const paletteSwatchRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusPaletteOnOpenRef = useRef(false);
  const workingRef = useRef<Uint8Array<ArrayBufferLike>>(workingIndices);
  const activeStroke = useRef(new Map<number, number>());
  const hasBuiltBoard = useRef(false);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const settingsReturnFocusRef = useRef<HTMLElement | null>(null);
  const resetTriggerRef = useRef<HTMLButtonElement>(null);

  const announceStatus = useCallback((message: string) => {
    setStatusMessage(message);
    setStatusRevision((revision) => revision + 1);
    setStatusVisible(true);
  }, []);

  useEffect(() => {
    document.title = 'Pixel Bead Simulator · Gregg’s IGCSE CS Playground';
  }, []);

  useEffect(() => {
    setStatusVisible(true);
    const timeout = window.setTimeout(() => setStatusVisible(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [statusMessage, statusRevision]);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      try {
        const data = extractCanonicalCrop(image);
        setSourceData(data);
        setImageStatus('ready');
        announceStatus('Reference ready. Select a bead to inspect it.');
      } catch {
        setImageStatus('error');
        announceStatus('The browser could not prepare the reference image.');
      }
    };
    image.onerror = () => {
      if (cancelled) return;
      setImageStatus('error');
      announceStatus('The reference image could not be loaded.');
    };
    image.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [announceStatus, loadAttempt]);

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
      announceStatus(
        `Board rebuilt from the original reference at ${width} × ${height}, ${bitsPerPixel} bpp.`,
      );
    }
    hasBuiltBoard.current = true;
  }, [announceStatus, bitsPerPixel, height, palette, sourceData, width]);

  const metrics = calculateImageMetrics(width, height, bitsPerPixel);
  const usedColours = useMemo(
    () => countUsedColours(workingIndices),
    [workingIndices],
  );
  const selectedPaletteIndex =
    selectedCell === null ? null : (workingIndices[selectedCell] ?? null);
  const selectedColour =
    selectedPaletteIndex === null ? null : palette[selectedPaletteIndex];
  const currentPaintColour = palette[paintIndex] ??
    palette[0] ?? {
      r: 17,
      g: 20,
      b: 15,
    };
  const selectedX = selectedCell === null ? null : selectedCell % width;
  const selectedY =
    selectedCell === null ? null : Math.floor(selectedCell / width);

  useLayoutEffect(() => {
    if (mode !== 'paint' || !focusPaletteOnOpenRef.current) return;
    focusPaletteOnOpenRef.current = false;
    paletteSwatchRefs.current[paintIndex]?.focus();
  }, [mode, paintIndex]);

  const beginStroke = useCallback(() => {
    activeStroke.current = new Map();
  }, []);

  const paintCell = useCallback(
    (index: number) => {
      const current = workingRef.current;
      if (index < 0 || index >= current.length || current[index] === paintIndex)
        return;
      if (!activeStroke.current.has(index)) {
        activeStroke.current.set(index, current[index]);
      }
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
    announceStatus(
      `${changes.length} bead${changes.length === 1 ? '' : 's'} painted. Press Ctrl or Command + Z to undo.`,
    );
  }, [announceStatus, baseIndices]);

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
    announceStatus('Last paint stroke undone.');
  }, [announceStatus, applyStroke, redoStack, undoStack]);

  const redo = useCallback(() => {
    const stroke = redoStack.at(-1);
    if (!stroke) return;
    applyStroke(stroke, 'redo');
    setRedoStack(redoStack.slice(0, -1));
    setUndoStack([...undoStack, stroke]);
    announceStatus('Paint stroke restored.');
  }, [announceStatus, applyStroke, redoStack, undoStack]);

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

  const chooseMode = (nextMode: CanvasMode) => {
    setMode(nextMode);
    announceStatus(
      nextMode === 'paint'
        ? 'Paint mode is on. Choose a colour, then draw on the board.'
        : 'Inspect mode is on. Select a bead to read its stored value.',
    );
  };

  const restoreImage = () => {
    const restored = baseIndices.slice();
    workingRef.current = restored;
    setWorkingIndices(restored);
    setSelectedCell(null);
    setUndoStack([]);
    setRedoStack([]);
    setIsDirty(false);
    announceStatus(
      'Artwork restored from the reference at the current settings.',
    );
  };

  const performResetDemo = () => {
    const settingsAlreadyDefault =
      width === DEFAULT_WIDTH &&
      height === DEFAULT_HEIGHT &&
      bitsPerPixel === DEFAULT_BPP;
    setWidth(DEFAULT_WIDTH);
    setHeight(DEFAULT_HEIGHT);
    setBitsPerPixel(DEFAULT_BPP);
    setAspectLocked(true);
    setMode('inspect');
    setPaintIndex(0);
    setSelectedCell(null);
    setLessonStep(1);
    setWorkspaceView('explore');
    setMobileStageView('simulation');
    setUndoStack([]);
    setRedoStack([]);
    setIsDirty(false);
    if (settingsAlreadyDefault) {
      const restored = baseIndices.slice();
      workingRef.current = restored;
      setWorkingIndices(restored);
    }
    setResetConfirmationOpen(false);
    announceStatus('Demo reset to 32 × 32 pixels and 4 bpp.');
  };

  const requestResetDemo = () => {
    if (isDirty) setResetConfirmationOpen(true);
    else performResetDemo();
  };

  const retryImage = () => {
    setImageStatus('loading');
    announceStatus('Loading the reference image…');
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
    announceStatus(
      nextLocked
        ? 'Aspect lock on. Width and height now change together.'
        : 'Aspect lock off. Width and height can change independently.',
    );
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
    announceStatus(message);
  };

  const applyGuidedPreset = (
    nextWidth: number,
    nextHeight: number,
    nextBits: number,
    message: string,
  ) => {
    applyPreset(nextWidth, nextHeight, nextBits, message);
    if (isMobileWorkbench) setSettingsOpen(false);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === workbenchRef.current) {
        await document.exitFullscreen();
      } else {
        await workbenchRef.current?.requestFullscreen();
      }
    } catch {
      announceStatus('Fullscreen is not available in this browser.');
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === workbenchRef.current);
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
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextStep = Math.max(1, step - 1) as LessonStep;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextStep = Math.min(4, step + 1) as LessonStep;
    }
    if (event.key === 'Home') nextStep = 1;
    if (event.key === 'End') nextStep = 4;
    if (nextStep === step) return;
    event.preventDefault();
    setLessonStep(nextStep);
    lessonTabRefs.current[nextStep - 1]?.focus();
  };

  const paletteTargetForKey = (
    button: HTMLButtonElement,
    index: number,
    key: string,
  ): number => {
    if (key === 'Home') return 0;
    if (key === 'End') return palette.length - 1;
    if (key === 'ArrowLeft') return Math.max(0, index - 1);
    if (key === 'ArrowRight') return Math.min(palette.length - 1, index + 1);
    if (key !== 'ArrowUp' && key !== 'ArrowDown') return index;

    const grid = button.closest('.palette-grid');
    if (!grid) return index;
    const swatches = [
      ...grid.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
    ];
    const currentTop = button.offsetTop;
    const targetRows = swatches
      .map((swatch, swatchIndex) => ({
        swatch,
        swatchIndex,
        top: swatch.offsetTop,
      }))
      .filter(({ top }) =>
        key === 'ArrowUp' ? top < currentTop : top > currentTop,
      );
    if (targetRows.length === 0) return index;
    const targetTop =
      key === 'ArrowUp'
        ? Math.max(...targetRows.map(({ top }) => top))
        : Math.min(...targetRows.map(({ top }) => top));
    const centre = button.offsetLeft + button.offsetWidth / 2;
    const nearest = targetRows
      .filter(({ top }) => top === targetTop)
      .sort(
        (a, b) =>
          Math.abs(a.swatch.offsetLeft + a.swatch.offsetWidth / 2 - centre) -
          Math.abs(b.swatch.offsetLeft + b.swatch.offsetWidth / 2 - centre),
      )[0];
    return nearest?.swatchIndex ?? index;
  };

  const handlePaletteKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (
      ![
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(event.key)
    ) {
      return;
    }
    const nextIndex = paletteTargetForKey(
      event.currentTarget,
      index,
      event.key,
    );
    event.preventDefault();
    setPaintIndex(nextIndex);
    setMode('paint');
    paletteSwatchRefs.current[nextIndex]?.focus();
  };

  const renderPalette = () => (
    <div className="palette-section">
      <div className="control-title">
        <span>Available palette</span>
        <Badge variant="outline">{palette.length} colours</Badge>
      </div>
      <div
        className="palette-grid"
        role="radiogroup"
        aria-label={`${palette.length} available paint colours`}
      >
        {palette.map((colour, index) => (
          <button
            key={`${rgbToHex(colour)}-${index}`}
            ref={(node) => {
              paletteSwatchRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={paintIndex === index}
            aria-label={`Palette ${index}, code ${binaryCode(index, bitsPerPixel)}, ${rgbToHex(colour)}`}
            title={`${binaryCode(index, bitsPerPixel)} · ${rgbToHex(colour)}`}
            className={
              paintIndex === index
                ? 'palette-swatch palette-swatch-selected'
                : 'palette-swatch'
            }
            style={{
              background: rgbToHex(colour),
              color: isDarkColour(colour) ? '#ffffff' : '#11140f',
            }}
            tabIndex={paintIndex === index ? 0 : -1}
            onClick={() => {
              setPaintIndex(index);
              setMode('paint');
              announceStatus(
                `Paint colour ${index} selected: ${rgbToHex(colour)}.`,
              );
            }}
            onKeyDown={(event) => handlePaletteKeyDown(event, index)}
          >
            {paintIndex === index && <Check aria-hidden="true" />}
          </button>
        ))}
      </div>
      <p className="palette-help">
        Choose a colour, then click or drag across the board. Arrow keys follow
        the palette’s visible rows and columns.
      </p>
    </div>
  );

  const renderCurrentColour = () => (
    <div className="current-colour-readout" aria-label="Current paint colour">
      <span
        className="current-colour-chip"
        style={{ background: rgbToHex(currentPaintColour) }}
        aria-hidden="true"
      />
      <span>
        <small>Current colour</small>
        <strong>{rgbToHex(currentPaintColour)}</strong>
      </span>
      <span>
        <small>Palette index</small>
        <strong>{paintIndex}</strong>
      </span>
      <span>
        <small>{bitsPerPixel}-bit code</small>
        <strong className="binary-value">
          {binaryCode(paintIndex, bitsPerPixel)}
        </strong>
      </span>
    </div>
  );

  const renderExploreControls = (idPrefix: string) => (
    <div className="explore-controls">
      {renderCurrentColour()}

      {isDirty && (
        <Alert className="paint-warning edits-warning">
          <Info />
          <AlertTitle>Paint edits are on the board</AlertTitle>
          <AlertDescription>
            Changing resolution or colour depth rebuilds the board and clears
            those edits.
          </AlertDescription>
        </Alert>
      )}

      <div className="control-section resolution-controls">
        <div className="control-title">
          <span>Resolution</span>
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
          <label htmlFor={`${idPrefix}-width-slider`}>
            <span>Width</span>
            <output>{width} px</output>
          </label>
          <Slider
            id={`${idPrefix}-width-slider`}
            min={8}
            max={64}
            step={4}
            value={[width]}
            onValueChange={(value) => changeWidth(scalarSliderValue(value))}
            aria-label="Image width in pixels"
          />
        </div>
        <div className="slider-control">
          <label htmlFor={`${idPrefix}-height-slider`}>
            <span>Height</span>
            <output>{height} px</output>
          </label>
          <Slider
            id={`${idPrefix}-height-slider`}
            min={8}
            max={64}
            step={4}
            value={[height]}
            onValueChange={(value) => changeHeight(scalarSliderValue(value))}
            aria-label="Image height in pixels"
            disabled={aspectLocked}
          />
        </div>
        <div className="preset-row" aria-label="Square resolution presets">
          {resolutionPresets.map((preset) => (
            <Button
              key={preset}
              variant={
                width === preset && height === preset ? 'secondary' : 'ghost'
              }
              size="sm"
              aria-pressed={width === preset && height === preset}
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

      <div className="control-section colour-depth-controls">
        <div className="control-title">
          <span>Colour depth</span>
          <strong>{bitsPerPixel} bpp</strong>
        </div>
        <div className="slider-control">
          <label htmlFor={`${idPrefix}-bpp-slider`}>
            <span>Bits per pixel</span>
            <output>
              {formatNumber(maximumColours(bitsPerPixel))} colours
            </output>
          </label>
          <Slider
            id={`${idPrefix}-bpp-slider`}
            min={1}
            max={8}
            step={1}
            value={[bitsPerPixel]}
            onValueChange={(value) => setBitsPerPixel(scalarSliderValue(value))}
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
            <strong>24 bpp = 8 bits for red + 8 for green + 8 for blue.</strong>{' '}
            It can represent 2<sup>24</sup> = 16,777,216 colours. At {width} ×{' '}
            {height}, its raw pixel data would be{' '}
            {formatRawSize(Math.ceil((width * height * 24) / 8))}.
          </p>
        </details>
      </div>

      {mode === 'paint' ? (
        renderPalette()
      ) : (
        <div className="palette-collapsed">
          <PaletteIcon aria-hidden="true" />
          <span>
            <strong>
              {formatNumber(metrics.maximumColours)} maximum colours
            </strong>
            <small>{formatNumber(usedColours)} used on this board</small>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => {
              focusPaletteOnOpenRef.current = event.detail === 0;
              chooseMode('paint');
            }}
          >
            Open palette
          </Button>
        </div>
      )}

      <div className="history-actions">
        <Button
          variant="outline"
          size="lg"
          onClick={restoreImage}
          disabled={!isDirty}
        >
          <RotateCcw /> Restore image
        </Button>
        <Button
          ref={resetTriggerRef}
          variant="ghost"
          size="lg"
          onClick={requestResetDemo}
        >
          <RefreshCcw /> Reset demo
        </Button>
      </div>
    </div>
  );

  const renderGuidedRail = () => {
    const lessonLabels = ['Pixel', 'Resolution', 'Colour depth', 'File size'];
    return (
      <div className="guided-rail">
        {isDirty && (
          <Alert className="paint-warning edits-warning">
            <Info />
            <AlertTitle>Paint edits are on the board</AlertTitle>
            <AlertDescription>
              Applying a lesson preset rebuilds the board and clears those
              edits.
            </AlertDescription>
          </Alert>
        )}
        <div
          className="lesson-steps guided-stepper"
          role="tablist"
          aria-label="Guided lesson steps"
          aria-orientation="vertical"
        >
          {([1, 2, 3, 4] as LessonStep[]).map((step) => (
            <button
              key={step}
              ref={(node) => {
                lessonTabRefs.current[step - 1] = node;
              }}
              id={`lesson-tab-${step}`}
              role="tab"
              aria-controls="guided-rail-panel"
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
              {lessonLabels[step - 1]}
            </button>
          ))}
        </div>

        <div
          className="guided-rail-content"
          id="guided-rail-panel"
          role="tabpanel"
          aria-labelledby={`lesson-tab-${lessonStep}`}
          tabIndex={0}
        >
          {lessonStep === 1 && (
            <>
              <p className="section-kicker">Step 1 · Pixel</p>
              <h3>One bead stores one picture element.</h3>
              <p>
                A pixel is the smallest addressable picture element in a raster
                image. Inspect one bead to reveal its coordinate, palette entry
                and stored binary code.
              </p>
              <div className="lesson-buttons">
                <Button
                  variant="outline"
                  onClick={() => {
                    applyGuidedPreset(
                      16,
                      16,
                      3,
                      'Pixel preset A ready at 16 × 16.',
                    );
                    setMode('inspect');
                  }}
                >
                  A · 16 × 16
                </Button>
                <Button
                  onClick={() => {
                    applyGuidedPreset(
                      32,
                      32,
                      4,
                      'Pixel preset B ready at 32 × 32.',
                    );
                    setMode('inspect');
                  }}
                >
                  B · 32 × 32
                </Button>
              </div>
            </>
          )}
          {lessonStep === 2 && (
            <>
              <p className="section-kicker">Step 2 · Image resolution</p>
              <h3>More pixels can represent more spatial detail.</h3>
              <p>
                Resolution means width × height in pixels. Keep colour depth at
                4 bpp and compare the two presets. This is not PPI or DPI.
              </p>
              <div className="lesson-buttons">
                <Button
                  variant="outline"
                  onClick={() =>
                    applyGuidedPreset(
                      8,
                      8,
                      4,
                      'Low-resolution example: 8 × 8 at 4 bpp.',
                    )
                  }
                >
                  A · 8 × 8
                </Button>
                <Button
                  onClick={() =>
                    applyGuidedPreset(
                      48,
                      48,
                      4,
                      'High-resolution example: 48 × 48 at 4 bpp.',
                    )
                  }
                >
                  B · 48 × 48
                </Button>
              </div>
            </>
          )}
          {lessonStep === 3 && (
            <>
              <p className="section-kicker">Step 3 · Colour depth</p>
              <h3>Each extra bit doubles the available colours.</h3>
              <p>
                At 32 × 32, compare 1 bpp with 8 bpp. Colour depth changes the
                possible colour choices—not the number of pixels.
              </p>
              <div className="lesson-buttons">
                <Button
                  variant="outline"
                  onClick={() =>
                    applyGuidedPreset(
                      32,
                      32,
                      1,
                      'Low colour-depth example: 1 bpp.',
                    )
                  }
                >
                  A · 1 bpp · 2 colours
                </Button>
                <Button
                  onClick={() =>
                    applyGuidedPreset(
                      32,
                      32,
                      8,
                      'High colour-depth example: 8 bpp.',
                    )
                  }
                >
                  B · 8 bpp · 256 colours
                </Button>
              </div>
            </>
          )}
          {lessonStep === 4 && (
            <>
              <p className="section-kicker">Step 4 · File size</p>
              <h3>Pixels × bits per pixel = raw image data.</h3>
              <p>
                Different settings can produce the same theoretical size. Both
                examples below equal 2,048 bits, or 256 bytes.
              </p>
              <div className="lesson-buttons">
                <Button
                  variant="outline"
                  onClick={() =>
                    applyGuidedPreset(
                      16,
                      16,
                      8,
                      '256 pixels × 8 bpp = 2,048 bits.',
                    )
                  }
                >
                  A · 16² × 8 bpp
                </Button>
                <Button
                  onClick={() =>
                    applyGuidedPreset(
                      32,
                      32,
                      2,
                      '1,024 pixels × 2 bpp = 2,048 bits.',
                    )
                  }
                >
                  B · 32² × 2 bpp
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const simulationPanel = (
    <article className="image-panel simulation-panel">
      <div className="panel-heading canvas-toolbar">
        <span className="simulation-label">
          <i aria-hidden="true" /> Simulation
          <Badge>
            {width} × {height}
          </Badge>
        </span>
        <div className="canvas-tools">
          <fieldset className="mode-switch">
            <legend className="sr-only">Board tool</legend>
            <Button
              variant={mode === 'inspect' ? 'default' : 'outline'}
              size="sm"
              onClick={() => chooseMode('inspect')}
              aria-pressed={mode === 'inspect'}
            >
              <Eye /> Inspect
            </Button>
            <Button
              variant={mode === 'paint' ? 'default' : 'outline'}
              size="sm"
              onClick={() => chooseMode('paint')}
              aria-pressed={mode === 'paint'}
            >
              <Brush /> Paint
            </Button>
          </fieldset>
          <span className="canvas-history">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={undoStack.length === 0}
              aria-label="Undo"
            >
              <Undo2 />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={redoStack.length === 0}
              aria-label="Redo"
            >
              <Redo2 />
            </Button>
          </span>
        </div>
      </div>
      <div className="canvas-frame simulation-frame">
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
    </article>
  );

  const referencePanel = (
    <article className="image-panel reference-panel">
      <div className="panel-heading">
        <span>Reference</span>
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
        <span className="sampling-note">
          White frame excluded from colour analysis
        </span>
      </div>
    </article>
  );

  return (
    <main className="page-wrap simulator-page">
      <section
        ref={workbenchRef}
        className="lab-workbench"
        aria-labelledby="simulator-title"
      >
        <header className="lab-toolbar">
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={openNavigation}
            aria-label="Open course navigation"
            aria-haspopup="dialog"
            aria-expanded={navigationOpen}
          >
            <Menu />
          </Button>
          <Link
            to={sectionRoute}
            className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} lab-back-link`}
          >
            <ArrowLeft />
            <span>1.2 Text, sound and images</span>
          </Link>
          <div className="lab-toolbar-title">
            <PaletteIcon aria-hidden="true" />
            <span>
              <small>Image representation lab</small>
              <h1 id="simulator-title">Pixel Bead Simulator</h1>
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 /> : <Maximize2 />}
            <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </Button>
        </header>

        <MetricFormula
          width={width}
          height={height}
          bitsPerPixel={bitsPerPixel}
          totalPixels={metrics.totalPixels}
          rawBits={metrics.rawBits}
          rawBytes={metrics.rawBytes}
          maximumColourCount={metrics.maximumColours}
          usedColours={usedColours}
        />

        {isMobileWorkbench && (
          <fieldset className="mobile-stage-switch">
            <legend className="sr-only">Mobile stage view</legend>
            <Button
              variant={mobileStageView === 'simulation' ? 'default' : 'outline'}
              aria-pressed={mobileStageView === 'simulation'}
              onClick={() => setMobileStageView('simulation')}
            >
              Simulation
            </Button>
            <Button
              variant={mobileStageView === 'compare' ? 'default' : 'outline'}
              aria-pressed={mobileStageView === 'compare'}
              onClick={() => setMobileStageView('compare')}
            >
              Compare
            </Button>
          </fieldset>
        )}

        <div className="simulator-grid lab-layout">
          <section
            className="visual-lab comparison-stage"
            aria-label="Reference and simulated image comparison"
          >
            <div
              className="visual-pair"
              data-mobile-stage-view={mobileStageView}
            >
              {simulationPanel}
              {(!isMobileWorkbench || mobileStageView === 'compare') &&
                referencePanel}
            </div>

            <div className="pixel-inspector pixel-readout">
              <output className="sr-only" aria-live="polite" aria-atomic="true">
                {selectedCell !== null &&
                selectedColour &&
                selectedPaletteIndex !== null
                  ? `Pixel ${selectedX}, ${selectedY}. Palette index ${selectedPaletteIndex}. ${bitsPerPixel}-bit code ${binaryCode(selectedPaletteIndex, bitsPerPixel)}. Colour ${rgbToHex(selectedColour)}.`
                  : ''}
              </output>
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
                    <small>{bitsPerPixel}-bit code</small>
                    <strong className="binary-value">
                      {binaryCode(selectedPaletteIndex, bitsPerPixel)}
                    </strong>
                  </span>
                  <span>
                    <small>Hex colour</small>
                    <strong>
                      <i style={{ background: rgbToHex(selectedColour) }} />
                      {rgbToHex(selectedColour)}
                    </strong>
                  </span>
                </div>
              ) : (
                <p>
                  Use Inspect and select a bead to reveal its coordinate,
                  palette entry and binary index.
                </p>
              )}
            </div>
          </section>

          {!isMobileWorkbench && (
            <aside
              className="controls-panel lab-rail"
              aria-label="Lab controls"
            >
              <div className="rail-header">
                <div>
                  <p className="section-kicker">Workspace</p>
                  <h2>{workspaceView === 'explore' ? 'Explore' : 'Guided'}</h2>
                </div>
                <fieldset className="workspace-switch">
                  <legend className="sr-only">Workspace view</legend>
                  <Button
                    variant={
                      workspaceView === 'explore' ? 'default' : 'outline'
                    }
                    size="sm"
                    aria-pressed={workspaceView === 'explore'}
                    onClick={() => setWorkspaceView('explore')}
                  >
                    Explore
                  </Button>
                  <Button
                    variant={workspaceView === 'guided' ? 'default' : 'outline'}
                    size="sm"
                    aria-pressed={workspaceView === 'guided'}
                    onClick={() => setWorkspaceView('guided')}
                  >
                    Guided
                  </Button>
                </fieldset>
              </div>
              <div className="rail-scroll">
                {workspaceView === 'explore'
                  ? renderExploreControls('rail')
                  : renderGuidedRail()}
              </div>
            </aside>
          )}
        </div>

        <output
          className={`lab-status ${statusVisible ? 'lab-status-visible' : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {statusMessage}
        </output>

        {isMobileWorkbench && (
          <div
            className="mobile-lab-dock"
            role="toolbar"
            aria-label="Mobile lab actions"
          >
            <div className="mobile-mode-switch">
              <Button
                variant={mode === 'inspect' ? 'default' : 'ghost'}
                aria-pressed={mode === 'inspect'}
                onClick={() => chooseMode('inspect')}
              >
                <Eye /> Inspect
              </Button>
              <Button
                variant={mode === 'paint' ? 'default' : 'ghost'}
                aria-pressed={mode === 'paint'}
                onClick={() => chooseMode('paint')}
              >
                <Brush /> Paint
              </Button>
            </div>
            <button
              type="button"
              className="dock-colour"
              style={{ background: rgbToHex(currentPaintColour) }}
              aria-label={`Current colour ${rgbToHex(currentPaintColour)}`}
              onClick={(event) => {
                settingsReturnFocusRef.current = event.currentTarget;
                setMode('paint');
                setSettingsOpen(true);
              }}
            >
              <span aria-hidden="true" />
            </button>
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={undo}
              disabled={undoStack.length === 0}
              aria-label="Undo"
            >
              <Undo2 />
            </Button>
            <Button
              ref={settingsTriggerRef}
              variant="ghost"
              size="icon-lg"
              onClick={(event) => {
                settingsReturnFocusRef.current = event.currentTarget;
                setSettingsOpen(true);
              }}
              aria-label="Open lab settings"
            >
              <Settings2 />
            </Button>
          </div>
        )}

        {settingsOpen && (
          <LabDialog
            className="settings-sheet"
            labelledBy="settings-title"
            onDismiss={() => setSettingsOpen(false)}
            returnFocusRef={settingsReturnFocusRef}
          >
            <div className="sheet-handle" aria-hidden="true" />
            <header className="dialog-header">
              <div>
                <p className="section-kicker">Workbench</p>
                <h2 id="settings-title">Lab settings</h2>
              </div>
              <Button
                variant="ghost"
                size="icon-lg"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close lab settings"
              >
                <X />
              </Button>
            </header>
            <fieldset className="workspace-switch mobile-workspace-switch">
              <legend className="sr-only">Mobile workspace view</legend>
              <Button
                variant={workspaceView === 'explore' ? 'default' : 'outline'}
                aria-pressed={workspaceView === 'explore'}
                onClick={() => setWorkspaceView('explore')}
              >
                Explore
              </Button>
              <Button
                variant={workspaceView === 'guided' ? 'default' : 'outline'}
                aria-pressed={workspaceView === 'guided'}
                onClick={() => setWorkspaceView('guided')}
              >
                Guided
              </Button>
            </fieldset>
            <div className="settings-sheet-scroll">
              {workspaceView === 'explore'
                ? renderExploreControls('sheet')
                : renderGuidedRail()}
            </div>
          </LabDialog>
        )}

        {resetConfirmationOpen && (
          <LabDialog
            className="reset-dialog"
            labelledBy="reset-dialog-title"
            onDismiss={() => setResetConfirmationOpen(false)}
            returnFocusRef={resetTriggerRef}
          >
            <div className="dialog-header">
              <div>
                <p className="section-kicker">Edited artwork</p>
                <h2 id="reset-dialog-title">Reset the whole demo?</h2>
              </div>
              <Button
                variant="ghost"
                size="icon-lg"
                onClick={() => setResetConfirmationOpen(false)}
                aria-label="Close reset confirmation"
              >
                <X />
              </Button>
            </div>
            <p>
              This clears your paint edits and returns resolution and colour
              depth to 32 × 32 pixels at 4 bpp.
            </p>
            <div className="dialog-actions">
              <Button
                variant="outline"
                onClick={() => setResetConfirmationOpen(false)}
              >
                Keep editing
              </Button>
              <Button variant="destructive" onClick={performResetDemo}>
                <RefreshCcw /> Reset demo
              </Button>
            </div>
          </LabDialog>
        )}
      </section>

      <section className="concept-reference" aria-labelledby="concept-title">
        <div className="concept-reference-heading">
          <p className="section-kicker">Concept reference</p>
          <h2 id="concept-title">The four ideas behind the experiment</h2>
          <p>
            Use these definitions when you explain what changed on the
            workbench.
          </p>
        </div>
        <div
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
                The number of bits used for each pixel’s colour. Maximum colours
                = 2<sup>bpp</sup>.
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
        </div>

        <Alert className="accuracy-note" role="note">
          <Info />
          <AlertTitle>Exam model versus a real file</AlertTitle>
          <AlertDescription>
            This demo calculates theoretical raw, uncompressed pixel data. A
            real PNG or JPEG also contains headers and metadata, and its actual
            size is affected by compression, palette storage and transparency.
            Increasing resolution or colour depth can improve fidelity to the
            same source, but it cannot recover detail that was never captured.
          </AlertDescription>
        </Alert>
      </section>
    </main>
  );
}
