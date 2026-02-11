import { useEffect, useRef } from 'react';

/**
 * iOS 13+ requires a user interaction (button click) to request access to sensors.
 * Call this function from your "Start Game" button's onClick handler.
 */
export async function requestMotionAccess(): Promise<boolean> {
  if (
    typeof DeviceMotionEvent !== 'undefined' &&
    // @ts-ignore - Check for iOS 13+ specific permission method
    typeof DeviceMotionEvent.requestPermission === 'function'
  ) {
    try {
      // @ts-ignore
      const permission = await DeviceMotionEvent.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.error('Motion permission denied', e);
      return false;
    }
  }
  // Android and non-iOS devices usually allow this by default or via browser prompt
  return true;
}

// --- Tuning ---
const TILT_THRESHOLD = 5.5;   // ~35 degrees tilt (9.8 * sin(35) ≈ 5.6)
const RESET_THRESHOLD = 2.0;  // Must return to nearly vertical (< ~12 degrees)
const SMOOTHING = 0.8;        // 0.8 = Heavy smoothing (removes jitter), 0.1 = Little smoothing

export function useTiltDetector(
  enabled: boolean,
  onTilt: (direction: 'forward' | 'backward') => void
) {
  // Use refs to keep state mutable without re-rendering
  const onTiltRef = useRef(onTilt);
  const zValRef = useRef(0);
  const isTriggeredRef = useRef(false);

  // Update callback ref so we don't re-bind listener when onTilt changes
  onTiltRef.current = onTilt;

  useEffect(() => {
    if (!enabled) {
      // Reset state when disabled
      zValRef.current = 0;
      isTriggeredRef.current = false;
      return;
    }

    const handleMotion = (event: DeviceMotionEvent) => {
      // We need accelerationIncludingGravity to detect tilt relative to the earth
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      // Z-Axis:
      // 0 = Vertical (Phone on forehead)
      // +9.8 = Flat on table, screen UP (Looking at ceiling)
      // -9.8 = Flat on table, screen DOWN (Looking at floor)
      const rawZ = acc.z || 0;

      // 1. Low Pass Filter (Smooth out the jitters)
      // New = (Current * smoothing) + (Old * (1 - smoothing))
      // Actually standard LPF: Output = alpha * New + (1-alpha) * Old
      // We'll use a simple weighted average
      zValRef.current = (rawZ * (1 - SMOOTHING)) + (zValRef.current * SMOOTHING);
      const currentZ = zValRef.current;

      // 2. Logic
      if (isTriggeredRef.current) {
        // WAITING FOR RESET: User is already tilted, waiting to return to neutral (vertical)
        if (Math.abs(currentZ) < RESET_THRESHOLD) {
          isTriggeredRef.current = false;
        }
      } else {
        // DETECTING TILT

        // Check Backward (Screen Up -> Z is Positive)
        if (currentZ > TILT_THRESHOLD) {
          isTriggeredRef.current = true;
          onTiltRef.current('backward'); // Pass/Correct
        }
        // Check Forward (Screen Down -> Z is Negative)
        else if (currentZ < -TILT_THRESHOLD) {
          isTriggeredRef.current = true;
          onTiltRef.current('forward'); // Skip
        }
      }
    };

    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [enabled]);
}