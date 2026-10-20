import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityType } from '../types/fitness';
import { estimateStrideLengthMeters } from '../utils/formulas';

export interface DeviceMotionState {
  isSupported: boolean;
  permissionState: 'prompt' | 'granted' | 'denied';
  isListening: boolean;
  steps: number;
  cadence: number; // steps/min
  distanceMeters: number;
  rawMagnitude: number;
  filteredMagnitude: number;
  magnitudeVariance: number;
  requestPermission: () => Promise<boolean>;
  resetSteps: () => void;
  // Simulation controls for desktop / demo
  isSimulating: boolean;
  startSimulation: (simCadence?: number) => void;
  stopSimulation: () => void;
  manualStep: () => void;
}

export function useDeviceMotion(
  heightCm: number,
  activityType: ActivityType,
  isWorkoutActive: boolean
): DeviceMotionState {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [steps, setSteps] = useState<number>(0);
  const [cadence, setCadence] = useState<number>(0);
  const [rawMagnitude, setRawMagnitude] = useState<number>(9.8);
  const [filteredMagnitude, setFilteredMagnitude] = useState<number>(9.8);
  const [magnitudeVariance, setMagnitudeVariance] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Algorithm state stored in refs to prevent render lag at 50-60Hz sensor rates
  const smoothedRef = useRef<number>(9.8);
  const baselineRef = useRef<number>(9.8);
  const lastStepTimestampRef = useRef<number>(0);
  const stepTimestampsRef = useRef<number[]>([]);
  const recentMagnitudesRef = useRef<number[]>([]);
  const isRisingRef = useRef<boolean>(false);
  const prevValueRef = useRef<number>(0);
  const dynamicThresholdRef = useRef<number>(1.2); // m/s² above baseline
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check hardware support on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      setIsSupported(true);
      // Check if permission is already granted or not needed (Android / standard browsers)
      if (typeof (DeviceMotionEvent as unknown as { requestPermission?: unknown }).requestPermission !== 'function') {
        setPermissionState('granted');
      }
    } else {
      setIsSupported(false);
    }
  }, []);

  // Request iOS permission on user gesture
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    const deviceMotionEvent = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof deviceMotionEvent.requestPermission === 'function') {
      try {
        const response = await deviceMotionEvent.requestPermission();
        if (response === 'granted') {
          setPermissionState('granted');
          return true;
        } else {
          setPermissionState('denied');
          return false;
        }
      } catch (err) {
        console.warn('Error requesting motion permission:', err);
        setPermissionState('denied');
        return false;
      }
    }

    setPermissionState('granted');
    return true;
  }, []);

  const resetSteps = useCallback(() => {
    setSteps(0);
    setCadence(0);
    stepTimestampsRef.current = [];
    lastStepTimestampRef.current = 0;
  }, []);

  // Process a registered step: updates cadence & refractory check
  const registerStep = useCallback((now: number) => {
    setSteps((prev) => prev + 1);

    // Keep timestamps within the last 7 seconds for cadence calculation
    const timestamps = stepTimestampsRef.current;
    timestamps.push(now);
    const windowStart = now - 7000;
    while (timestamps.length > 0 && timestamps[0] < windowStart) {
      timestamps.shift();
    }

    if (timestamps.length >= 2) {
      const elapsedSeconds = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000;
      if (elapsedSeconds > 0.5) {
        const calculatedCadence = Math.round(((timestamps.length - 1) / elapsedSeconds) * 60);
        // Clamp to realistic human range (30 - 240 spm)
        setCadence(Math.min(240, Math.max(0, calculatedCadence)));
      }
    }
  }, []);

  // Cadence decay timer: if no step occurred in the last 2.8 seconds, drop cadence to 0
  useEffect(() => {
    const decayInterval = setInterval(() => {
      const now = Date.now();
      if (lastStepTimestampRef.current > 0 && now - lastStepTimestampRef.current > 2800) {
        setCadence(0);
        stepTimestampsRef.current = [];
      }
    }, 1000);

    return () => clearInterval(decayInterval);
  }, []);

  // Core Accelerometer event handler
  const handleDeviceMotion = useCallback(
    (event: DeviceMotionEvent) => {
      if (!isWorkoutActive) return;

      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const x = acc.x;
      const y = acc.y;
      const z = acc.z;

      // 1. Compute 3D Euclidean magnitude
      const mag = Math.sqrt(x * x + y * y + z * z);
      setRawMagnitude(Math.round(mag * 10) / 10);

      // 2. Low-Pass Filter (Exponential Moving Average)
      // alpha = 0.22 isolates high frequency tremors while keeping foot-strike spikes
      const alpha = 0.22;
      const smoothed = alpha * mag + (1 - alpha) * smoothedRef.current;
      smoothedRef.current = smoothed;
      setFilteredMagnitude(Math.round(smoothed * 10) / 10);

      // Baseline gravity tracker (slow EMA, beta = 0.04)
      const beta = 0.04;
      const baseline = beta * mag + (1 - beta) * baselineRef.current;
      baselineRef.current = baseline;

      // Dynamic acceleration (removes gravity tilt)
      const netAcc = smoothed - baseline;

      // 3. Rolling variance for Activity Recognition
      const rec = recentMagnitudesRef.current;
      rec.push(netAcc);
      if (rec.length > 25) rec.shift();

      if (rec.length >= 10) {
        const mean = rec.reduce((a, b) => a + b, 0) / rec.length;
        const variance = rec.reduce((a, b) => a + (b - mean) ** 2, 0) / rec.length;
        setMagnitudeVariance(Math.round(variance * 100) / 100);
      }

      // 4. Peak Detection with Dynamic Threshold and Refractory Window
      // Refractory period: minimum 240ms between steps (~250 steps/min maximum)
      const now = Date.now();
      const timeSinceLastStep = now - lastStepTimestampRef.current;

      const prev = prevValueRef.current;
      // Detect slope change (local peak)
      if (netAcc > prev) {
        isRisingRef.current = true;
      } else if (isRisingRef.current && netAcc < prev) {
        // Turned downwards -> previous sample was a local peak
        const peakHeight = prev;
        const threshold = dynamicThresholdRef.current;

        if (peakHeight >= threshold && timeSinceLastStep >= 240) {
          lastStepTimestampRef.current = now;
          registerStep(now);

          // Adapt dynamic threshold based on recent peak height (exponential decay towards baseline 1.1)
          dynamicThresholdRef.current = Math.max(0.9, Math.min(3.2, 0.6 * threshold + 0.4 * (peakHeight * 0.55)));
        }
        isRisingRef.current = false;
      }

      prevValueRef.current = netAcc;
    },
    [isWorkoutActive, registerStep]
  );

  // Attach motion listener when permission is granted and workout is active
  useEffect(() => {
    if (permissionState === 'granted' && isWorkoutActive && isSupported) {
      window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
      setIsListening(true);

      return () => {
        window.removeEventListener('devicemotion', handleDeviceMotion);
        setIsListening(false);
      };
    } else {
      setIsListening(false);
    }
  }, [permissionState, isWorkoutActive, isSupported, handleDeviceMotion]);

  // Simulation controls for testing / desktop environments
  const startSimulation = useCallback(
    (simCadence: number = 110) => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      setIsSimulating(true);

      const intervalMs = (60 / simCadence) * 1000;
      simIntervalRef.current = setInterval(() => {
        const now = Date.now();
        lastStepTimestampRef.current = now;
        registerStep(now);
        // Simulate synthetic variance corresponding to activity
        const simVariance = simCadence > 140 ? 3.2 : 0.9;
        setMagnitudeVariance(simVariance);
        setRawMagnitude(9.8 + (Math.random() - 0.5) * 4);
      }, intervalMs);
    },
    [registerStep]
  );

  const stopSimulation = useCallback(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsSimulating(false);
    setCadence(0);
    setMagnitudeVariance(0);
  }, []);

  const manualStep = useCallback(() => {
    const now = Date.now();
    lastStepTimestampRef.current = now;
    registerStep(now);
    setMagnitudeVariance(1.1);
  }, [registerStep]);

  // Clean up simulation on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  // Distance calculation based on stride length
  const strideLengthMeters = estimateStrideLengthMeters(heightCm, activityType);
  const distanceMeters = Math.round(steps * strideLengthMeters);

  return {
    isSupported,
    permissionState,
    isListening,
    steps,
    cadence,
    distanceMeters,
    rawMagnitude,
    filteredMagnitude,
    magnitudeVariance,
    requestPermission,
    resetSteps,
    isSimulating,
    startSimulation,
    stopSimulation,
    manualStep,
  };
}
