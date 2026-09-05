import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useStudioAudio } from '../src/lib/useStudioAudio';

function audioMock(resume = () => Promise.resolve()) {
  const sources: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
  }[] = [];
  const gains: { disconnect: ReturnType<typeof vi.fn> }[] = [];
  const close = vi.fn();
  const createBuffer = vi.fn(
    (_channels: number, length: number, rate: number) => ({
      duration: length / rate,
      getChannelData: () => new Float32Array(length),
    }),
  );
  class Context {
    currentTime = 0;
    destination = {};
    close = close;
    resume = resume;
    createBuffer = createBuffer;
    createBufferSource() {
      const source = {
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
        connect: vi.fn((gain) => gain),
      };
      sources.push(source);
      return source;
    }
    createGain() {
      const gain = {
        gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      gains.push(gain);
      return gain;
    }
  }
  vi.stubGlobal('AudioContext', Context);
  return { sources, gains, close, createBuffer };
}
it('plays actual sample data at its represented rate and owns one player', async () => {
  const mock = audioMock();
  const { result, unmount } = renderHook(() => useStudioAudio());
  await act(() => result.current.play(new Float32Array(8000), 8000, 'A'));
  expect(mock.createBuffer).toHaveBeenCalledWith(1, 8000, 8000);
  expect(result.current.playing).toBe('A');
  await act(() => result.current.play(new Float32Array(48000), 48000, 'B'));
  expect(mock.sources[0].stop).toHaveBeenCalledOnce();
  expect(mock.gains[0].disconnect).toHaveBeenCalledOnce();
  unmount();
  expect(mock.sources[1].stop).toHaveBeenCalledOnce();
  expect(mock.close).toHaveBeenCalledOnce();
});
it('cannot start a stale play request after navigation or Stop', async () => {
  let resume!: () => void;
  const mock = audioMock(
    () =>
      new Promise<void>((resolve) => {
        resume = resolve;
      }),
  );
  const { result, unmount } = renderHook(() => useStudioAudio());
  let request!: Promise<void>;
  act(() => {
    request = result.current.play(new Float32Array(48000), 48000, 'A');
  });
  act(() => result.current.stop());
  await act(async () => {
    resume();
    await request;
  });
  expect(mock.sources).toHaveLength(0);
  unmount();
});
it('releases a microphone granted after the studio was closed', async () => {
  audioMock();
  let grant!: (stream: MediaStream) => void;
  const stop = vi.fn();
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: () =>
        new Promise<MediaStream>((resolve) => {
          grant = resolve;
        }),
    },
  });
  vi.stubGlobal('MediaRecorder', class {});
  const { result, unmount } = renderHook(() => useStudioAudio());
  let recording!: Promise<void>;
  act(() => {
    recording = result.current.record(vi.fn());
  });
  unmount();
  await act(async () => {
    grant({ getTracks: () => [{ stop }] } as unknown as MediaStream);
    await recording;
  });
  expect(stop).toHaveBeenCalledOnce();
});
