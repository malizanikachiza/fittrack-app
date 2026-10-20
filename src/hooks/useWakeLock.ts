import { useCallback, useEffect, useRef, useState } from 'react';

export function useWakeLock(shouldKeepAwake: boolean) {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const wakeLockSentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const requestLock = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (wakeLockSentinelRef.current) return;
      const sentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinelRef.current = sentinel;
      setIsLocked(true);

      sentinel.addEventListener('release', () => {
        wakeLockSentinelRef.current = null;
        setIsLocked(false);
      });
    } catch (err) {
      console.warn('Screen WakeLock request failed:', err);
      setIsLocked(false);
    }
  }, []);

  const releaseLock = useCallback(async () => {
    if (wakeLockSentinelRef.current) {
      try {
        await wakeLockSentinelRef.current.release();
      } catch {
        // ignore
      }
      wakeLockSentinelRef.current = null;
      setIsLocked(false);
    }
  }, []);

  // React to shouldKeepAwake state
  useEffect(() => {
    if (shouldKeepAwake) {
      requestLock();
    } else {
      releaseLock();
    }
  }, [shouldKeepAwake, requestLock, releaseLock]);

  // Handle visibility change (re-acquire wake lock when tab returns to view)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldKeepAwake) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseLock();
    };
  }, [shouldKeepAwake, requestLock, releaseLock]);

  return { isSupported, isLocked };
}
