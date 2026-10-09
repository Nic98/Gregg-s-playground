import { useCallback, useEffect, useRef, useState } from 'react';
import { PACKET_DURATION, PACKET_STAGES } from './packetSwitching';

/** Shared stage clock: controls and packet positions never run separate timers. */
export function usePacketClock(active = true) {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const elapsed = useRef(0);
  const target = useRef(PACKET_DURATION);

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
        target.current,
        elapsed.current + (delta * speed) / 750,
      );
      setTime(
        reducedMotion && elapsed.current < target.current
          ? Math.floor(elapsed.current)
          : elapsed.current,
      );
      if (elapsed.current >= target.current) setRunning(false);
      else frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [running, active, speed, reducedMotion]);

  const reset = useCallback(() => {
    elapsed.current = 0;
    target.current = PACKET_DURATION;
    setTime(0);
    setStarted(false);
    setRunning(false);
  }, []);

  const startTowards = (end: number) => {
    target.current = end;
    setStarted(true);
    setRunning(true);
  };
  const restart = () => {
    elapsed.current = 0;
    setTime(0);
    startTowards(PACKET_DURATION);
  };

  return {
    time,
    running,
    started,
    speed,
    setSpeed,
    reducedMotion,
    reset,
    next: () => {
      if (reducedMotion) elapsed.current = time;
      const next = PACKET_STAGES.find(
        (stage) => stage.end > elapsed.current + 0.000001,
      );
      if (next) startTowards(next.end);
    },
    previous: () => {
      setRunning(false);
      const previous = [...PACKET_STAGES]
        .reverse()
        .find((stage) => stage.end < time - 0.000001);
      elapsed.current = previous?.end ?? 0;
      setTime(elapsed.current);
      setStarted(elapsed.current > 0);
      target.current = PACKET_DURATION;
    },
    playAll: () => {
      if (elapsed.current >= PACKET_DURATION) restart();
      else startTowards(PACKET_DURATION);
    },
    toggle: () => {
      if (running) {
        if (reducedMotion) elapsed.current = time;
        setRunning(false);
      } else if (elapsed.current >= PACKET_DURATION) {
        restart();
      } else {
        if (target.current <= elapsed.current) {
          target.current =
            PACKET_STAGES.find((stage) => stage.end > elapsed.current)?.end ??
            PACKET_DURATION;
        }
        setStarted(true);
        setRunning(true);
      }
    },
    replay: restart,
    complete: time >= PACKET_DURATION,
  };
}

export type PacketClock = ReturnType<typeof usePacketClock>;
