import { useState, useEffect, useCallback, useRef } from 'react';

export function Timer({
  seconds,
  running,
  onTimeUp,
}: {
  seconds: number;
  running: boolean;
  onTimeUp: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isLow = remaining <= 10 && running;

  return (
    <div
      className={`text-center font-mono text-4xl font-bold tabular-nums ${
        isLow ? 'text-red-400 animate-pulse' : 'text-white'
      }`}
    >
      {mins}:{secs.toString().padStart(2, '0')}
    </div>
  );
}

export function useTimer(initialSeconds: number) {
  const [running, setRunning] = useState(false);
  const start = useCallback(() => setRunning(true), []);
  const stop = useCallback(() => setRunning(false), []);
  return { running, start, stop, initialSeconds };
}
