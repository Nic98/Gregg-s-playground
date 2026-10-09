import { useCallback, useEffect, useRef, useState } from 'react';

/** A single teaching clock, shared by every board in a comparison. */
export function useTransmissionClock(duration: number, active: boolean) {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const elapsed = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    const hide = () => {
      if (document.hidden) setRunning(false);
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      query.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);

  useEffect(() => {
    if (!active) setRunning(false);
  }, [active]);

  useEffect(() => {
    if (!running || !active) return;
    let frame = 0;
    let previous: number | undefined;
    const advance = (now: number) => {
      const delta = previous === undefined ? 0 : Math.min(now - previous, 100);
      previous = now;
      elapsed.current = Math.min(
        duration,
        elapsed.current + (delta * speed) / 750,
      );
      setTime(
        reducedMotion && elapsed.current < duration
          ? Math.floor(elapsed.current)
          : elapsed.current,
      );
      if (elapsed.current >= duration) setRunning(false);
      else frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [running, active, speed, duration, reducedMotion]);

  const reset = useCallback(() => {
    elapsed.current = 0;
    setTime(0);
    setStarted(false);
    setRunning(false);
  }, []);
  const play = () => {
    elapsed.current = 0;
    setTime(0);
    setStarted(true);
    setRunning(true);
  };
  const step = () => {
    setRunning(false);
    setStarted(true);
    elapsed.current = Math.min(duration, time + 1);
    setTime(elapsed.current);
  };

  return {
    time,
    running,
    started,
    speed,
    setSpeed,
    reducedMotion,
    reset,
    play,
    step,
    toggle: () => {
      if (reducedMotion) elapsed.current = time;
      setRunning((value) => !value);
    },
    complete: started && time >= duration,
    busy: started && time < duration,
  };
}

export type TransmissionClock = ReturnType<typeof useTransmissionClock>;
