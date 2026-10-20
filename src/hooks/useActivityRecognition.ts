import { useEffect, useRef, useState } from 'react';
import { ActivityType } from '../types/fitness';

export interface ActivityRecognitionState {
  currentActivity: ActivityType;
  detectedActivity: ActivityType;
  isManualOverride: boolean;
  setManualActivity: (type: ActivityType) => void;
  resetToAuto: () => void;
  confidence: number; // 0 - 100%
}

export function useActivityRecognition(
  cadence: number,
  variance: number,
  isWorkoutActive: boolean,
  initialActivity: ActivityType = 'walking'
): ActivityRecognitionState {
  const [currentActivity, setCurrentActivity] = useState<ActivityType>(initialActivity);
  const [detectedActivity, setDetectedActivity] = useState<ActivityType>(initialActivity);
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [confidence, setConfidence] = useState<number>(85);

  const candidateRef = useRef<ActivityType>(initialActivity);
  const candidateCountRef = useRef<number>(0);

  useEffect(() => {
    if (!isWorkoutActive) return;

    // Automatic Classification Logic based on cadence and acceleration variance
    let detected: ActivityType = 'gym';
    let conf = 75;

    // Thresholds:
    // Running: Cadence > 130 steps/min OR Variance > 2.2 m/s²
    // Walking: Cadence 35 - 130 steps/min OR Variance 0.3 - 2.2 m/s²
    // Gym / Stationary: Cadence < 35 AND Variance < 0.3 m/s²
    if (cadence >= 135 || variance >= 2.4) {
      detected = 'running';
      conf = cadence >= 150 ? 95 : 85;
    } else if (cadence >= 35 || variance >= 0.32) {
      detected = 'walking';
      conf = cadence >= 80 ? 90 : 80;
    } else {
      detected = 'gym';
      conf = 85;
    }

    // Debounce state changes: require 2 checks before switching detected activity
    if (candidateRef.current === detected) {
      candidateCountRef.current += 1;
      if (candidateCountRef.current >= 2) {
        setDetectedActivity(detected);
        setConfidence(conf);
        if (!isManualOverride) {
          setCurrentActivity(detected);
        }
      }
    } else {
      candidateRef.current = detected;
      candidateCountRef.current = 1;
    }
  }, [cadence, variance, isWorkoutActive, isManualOverride]);

  const setManualActivity = (type: ActivityType) => {
    setIsManualOverride(true);
    setCurrentActivity(type);
  };

  const resetToAuto = () => {
    setIsManualOverride(false);
    setCurrentActivity(detectedActivity);
  };

  return {
    currentActivity,
    detectedActivity,
    isManualOverride,
    setManualActivity,
    resetToAuto,
    confidence,
  };
}
