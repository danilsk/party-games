import { useEffect, useRef } from 'react';

export function useWakeLock(active: boolean = true) {
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) return;

    let released = false;

    async function acquire() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock.current = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Wake Lock not supported or denied
      }
    }

    acquire();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !released) {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      wakeLock.current?.release().catch(() => {});
      wakeLock.current = null;
    };
  }, [active]);
}
