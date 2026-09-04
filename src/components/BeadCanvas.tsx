/* eslint-disable jsx-a11y/no-interactive-element-to-noninteractive-role -- The canvas is deliberately exposed as one keyboard-operated application, not an incomplete grid. */
import { useCallback, useEffect, useId, useRef } from 'react';
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { RGB } from '@/src/lib/imageMath';
import { rgbToHex } from '@/src/lib/imageMath';

export type CanvasMode = 'inspect' | 'paint';

interface BeadCanvasProps {
  width: number;
  height: number;
  palette: RGB[];
  indices: Uint8Array;
  mode: CanvasMode;
  paintIndex: number;
  selectedCell: number | null;
  onSelectCell: (index: number) => void;
  onBeginStroke: () => void;
  onPaintCell: (index: number) => void;
  onFinishStroke: () => void;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

export function BeadCanvas({
  width,
  height,
  palette,
  indices,
  mode,
  paintIndex,
  selectedCell,
  onSelectCell,
  onBeginStroke,
  onPaintCell,
  onFinishStroke,
}: BeadCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointer = useRef<number | null>(null);
  const lastPaintedCell = useRef<number | null>(null);
  const instructionsId = useId();

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || palette.length === 0 || indices.length === 0) return;
    const rectangle = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    const renderWidth = Math.max(1, Math.round(rectangle.width * pixelRatio));
    const renderHeight = Math.max(1, Math.round(rectangle.height * pixelRatio));
    if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
      canvas.width = renderWidth;
      canvas.height = renderHeight;
    }
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, rectangle.width, rectangle.height);

    const cellWidth = rectangle.width / width;
    const cellHeight = rectangle.height / height;
    const smallestCell = Math.min(cellWidth, cellHeight);
    const gap = smallestCell >= 8 ? 0.75 : smallestCell >= 4 ? 0.35 : 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;
        const colour = palette[indices[index]] ?? palette[0];
        const left = x * cellWidth;
        const top = y * cellHeight;
        context.fillStyle = rgbToHex(colour);
        roundedRect(
          context,
          left + gap / 2,
          top + gap / 2,
          Math.max(0, cellWidth - gap),
          Math.max(0, cellHeight - gap),
          Math.min(2.5, smallestCell * 0.18),
        );
        context.fill();

        if (smallestCell >= 7) {
          const centreX = left + cellWidth * 0.42;
          const centreY = top + cellHeight * 0.38;
          const radius = smallestCell * 0.2;
          const highlight = context.createRadialGradient(
            centreX - radius * 0.25,
            centreY - radius * 0.25,
            radius * 0.1,
            centreX,
            centreY,
            radius,
          );
          highlight.addColorStop(0, 'rgba(255,255,255,.28)');
          highlight.addColorStop(0.72, 'rgba(255,255,255,.04)');
          highlight.addColorStop(1, 'rgba(0,0,0,.16)');
          context.fillStyle = highlight;
          context.beginPath();
          context.arc(centreX, centreY, radius, 0, Math.PI * 2);
          context.fill();
        }
      }
    }

    if (
      selectedCell !== null &&
      selectedCell >= 0 &&
      selectedCell < indices.length
    ) {
      const x = selectedCell % width;
      const y = Math.floor(selectedCell / width);
      context.save();
      context.lineWidth = Math.max(2, smallestCell * 0.12);
      context.strokeStyle = '#FFFFFF';
      context.shadowColor = 'rgba(0,0,0,.8)';
      context.shadowBlur = 3;
      context.strokeRect(
        x * cellWidth + 1,
        y * cellHeight + 1,
        cellWidth - 2,
        cellHeight - 2,
      );
      context.restore();
    }
  }, [height, indices, palette, selectedCell, width]);

  useEffect(() => {
    render();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [render]);

  const cellFromPointer = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ): number => {
    const rectangle = event.currentTarget.getBoundingClientRect();
    if (
      rectangle.width <= 0 ||
      rectangle.height <= 0 ||
      !Number.isFinite(event.clientX) ||
      !Number.isFinite(event.clientY)
    ) {
      return 0;
    }
    const x = Math.min(
      width - 1,
      Math.max(
        0,
        Math.floor(
          ((event.clientX - rectangle.left) / rectangle.width) * width,
        ),
      ),
    );
    const y = Math.min(
      height - 1,
      Math.max(
        0,
        Math.floor(
          ((event.clientY - rectangle.top) / rectangle.height) * height,
        ),
      ),
    );
    return y * width + x;
  };

  const paintLine = (from: number, to: number) => {
    let x0 = from % width;
    let y0 = Math.floor(from / width);
    const x1 = to % width;
    const y1 = Math.floor(to / width);
    const deltaX = Math.abs(x1 - x0);
    const stepX = x0 < x1 ? 1 : -1;
    const deltaY = -Math.abs(y1 - y0);
    const stepY = y0 < y1 ? 1 : -1;
    let error = deltaX + deltaY;
    while (true) {
      onPaintCell(y0 * width + x0);
      if (x0 === x1 && y0 === y1) break;
      const doubledError = 2 * error;
      if (doubledError >= deltaY) {
        error += deltaY;
        x0 += stepX;
      }
      if (doubledError <= deltaX) {
        error += deltaX;
        y0 += stepY;
      }
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const cell = cellFromPointer(event);
    event.currentTarget.focus();
    onSelectCell(cell);
    if (mode === 'paint') {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      activePointer.current = event.pointerId;
      lastPaintedCell.current = cell;
      onBeginStroke();
      onPaintCell(cell);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'paint' || activePointer.current !== event.pointerId) return;
    const cell = cellFromPointer(event);
    if (cell === lastPaintedCell.current) return;
    paintLine(lastPaintedCell.current ?? cell, cell);
    lastPaintedCell.current = cell;
    onSelectCell(cell);
  };

  const finishPointerStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePointer.current = null;
    lastPaintedCell.current = null;
    onFinishStroke();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const current = selectedCell ?? 0;
    const currentX = current % width;
    const currentY = Math.floor(current / width);
    let next = current;
    if (event.key === 'ArrowLeft' && currentX > 0) next = current - 1;
    if (event.key === 'ArrowRight' && currentX < width - 1) next = current + 1;
    if (event.key === 'ArrowUp' && currentY > 0) next = current - width;
    if (event.key === 'ArrowDown' && currentY < height - 1)
      next = current + width;
    if (event.key === 'Home') next = currentY * width;
    if (event.key === 'End') next = currentY * width + width - 1;
    const isMovementKey = [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ].includes(event.key);
    if (isMovementKey) {
      event.preventDefault();
      onSelectCell(selectedCell === null ? 0 : next);
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectCell(current);
      if (mode === 'paint') {
        onBeginStroke();
        onPaintCell(current);
        onFinishStroke();
      }
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`bead-canvas bead-canvas-${mode}`}
        role="application"
        aria-roledescription="interactive pixel board"
        tabIndex={0}
        aria-describedby={instructionsId}
        aria-label={`${width} by ${height} interactive bead image. ${mode === 'paint' ? `Paint mode, selected palette colour ${paintIndex}.` : 'Inspect mode.'}`}
        style={{ touchAction: mode === 'paint' ? 'none' : 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerStroke}
        onPointerCancel={finishPointerStroke}
        onKeyDown={handleKeyDown}
      >
        Interactive pixel bead board
      </canvas>
      <span id={instructionsId} className="sr-only">
        Use the arrow keys to move between pixels. Press Enter or Space to
        inspect the current pixel or paint it when Paint mode is active.
      </span>
    </>
  );
}
