import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(cleanup);

class ResizeObserverMock implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}

  disconnect() {}
  observe(_target: Element) {}
  unobserve() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

class PointerEventMock extends MouseEvent {
  readonly pointerId: number;

  constructor(type: string, properties: PointerEventInit = {}) {
    super(type, properties);
    this.pointerId = properties.pointerId ?? 1;
  }
}

vi.stubGlobal('PointerEvent', PointerEventMock);

Object.defineProperties(HTMLCanvasElement.prototype, {
  setPointerCapture: { configurable: true, value: vi.fn() },
  hasPointerCapture: { configurable: true, value: vi.fn(() => true) },
  releasePointerCapture: { configurable: true, value: vi.fn() },
});
