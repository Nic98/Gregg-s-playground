import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BeadCanvas } from '@/src/components/BeadCanvas';

const palette = [
  { r: 0, g: 0, b: 0 },
  { r: 255, g: 255, b: 255 },
];

function contextMock() {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    strokeRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillStyle: '',
    lineWidth: 1,
    strokeStyle: '',
    shadowColor: '',
    shadowBlur: 0,
  } as unknown as CanvasRenderingContext2D;
}

describe('BeadCanvas', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      contextMock(),
    );
    vi.spyOn(
      HTMLCanvasElement.prototype,
      'getBoundingClientRect',
    ).mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 120,
      bottom: 120,
      width: 120,
      height: 120,
      toJSON: () => ({}),
    });
  });

  it('uses the full device-pixel ratio for its backing canvas', () => {
    vi.stubGlobal('devicePixelRatio', 3);
    const { getByRole } = render(
      <BeadCanvas
        width={4}
        height={4}
        palette={palette}
        indices={new Uint8Array(16)}
        mode="inspect"
        paintIndex={0}
        selectedCell={null}
        onSelectCell={vi.fn()}
        onBeginStroke={vi.fn()}
        onPaintCell={vi.fn()}
        onFinishStroke={vi.fn()}
      />,
    );
    const canvas = getByRole('application') as HTMLCanvasElement;
    expect(canvas.width).toBe(360);
    expect(canvas.height).toBe(360);
  });

  it('treats a pointer drag as one stroke transaction', () => {
    const begin = vi.fn();
    const paint = vi.fn();
    const finish = vi.fn();
    const { getByRole } = render(
      <BeadCanvas
        width={4}
        height={4}
        palette={palette}
        indices={new Uint8Array(16)}
        mode="paint"
        paintIndex={1}
        selectedCell={null}
        onSelectCell={vi.fn()}
        onBeginStroke={begin}
        onPaintCell={paint}
        onFinishStroke={finish}
      />,
    );
    const canvas = getByRole('application');
    fireEvent.pointerDown(canvas, { pointerId: 7, clientX: 5, clientY: 5 });
    fireEvent.pointerMove(canvas, { pointerId: 7, clientX: 115, clientY: 115 });
    fireEvent.pointerUp(canvas, { pointerId: 7, clientX: 115, clientY: 115 });

    expect(begin).toHaveBeenCalledTimes(1);
    expect(finish).toHaveBeenCalledTimes(1);
    expect(
      new Set(paint.mock.calls.map(([index]) => index)).size,
    ).toBeGreaterThan(2);
  });

  it('keeps horizontal keyboard movement within a row and selects cell zero initially', () => {
    const select = vi.fn();
    const { getByRole, rerender } = render(
      <BeadCanvas
        width={4}
        height={4}
        palette={palette}
        indices={new Uint8Array(16)}
        mode="inspect"
        paintIndex={0}
        selectedCell={null}
        onSelectCell={select}
        onBeginStroke={vi.fn()}
        onPaintCell={vi.fn()}
        onFinishStroke={vi.fn()}
      />,
    );
    const canvas = getByRole('application');
    fireEvent.keyDown(canvas, { key: 'ArrowLeft' });
    expect(select).toHaveBeenLastCalledWith(0);

    select.mockClear();
    rerender(
      <BeadCanvas
        width={4}
        height={4}
        palette={palette}
        indices={new Uint8Array(16)}
        mode="inspect"
        paintIndex={0}
        selectedCell={3}
        onSelectCell={select}
        onBeginStroke={vi.fn()}
        onPaintCell={vi.fn()}
        onFinishStroke={vi.fn()}
      />,
    );
    fireEvent.keyDown(canvas, { key: 'ArrowRight' });
    expect(select).toHaveBeenLastCalledWith(3);
  });
});
