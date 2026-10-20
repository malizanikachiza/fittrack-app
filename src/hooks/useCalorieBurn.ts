import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityType, Sex } from '../types/fitness';
import { calculateHeartRateCaloriesPerSecond, calculateMETCaloriesPerSecond } from '../utils/formulas';

export interface CalorieBurnState {
  totalCalories: number;
  burnRateKcalPerHour: number;
  activeMethod: 'heart_rate' | 'met';
  resetCalories: () => void;
  setAccumulatedCalories: (cal: number) => void;
}

export function useCalorieBurn(
  isWorkoutActive: boolean,
  activityType: ActivityType,
  cadence: number,
  currentBpm: number | null,
  weightKg: number,
  age: number,
  sex: Sex
): CalorieBurnState {
  const [totalCalories, setTotalCalories] = useState<number>(0);
  const [activeMethod, setActiveMethod] = useState<'heart_rate' | 'met'>('met');
  const [burnRateKcalPerHour, setBurnRateKcalPerHour] = useState<number>(0);

  const accumulatedCaloriesRef = useRef<number>(0);

  const resetCalories = useCallback(() => {
    accumulatedCaloriesRef.current = 0;
    setTotalCalories(0);
    setBurnRateKcalPerHour(0);
  }, []);

  const setAccumulatedCalories = useCallback((cal: number) => {
    accumulatedCaloriesRef.current = cal;
    setTotalCalories(Math.round(cal * 10) / 10);
  }, []);

  useEffect(() => {
    if (!isWorkoutActive) {
      setBurnRateKcalPerHour(0);
      return;
    }

    const timer = setInterval(() => {
      let calPerSecond = 0;
      let method: 'heart_rate' | 'met' = 'met';

      // Prefer Keytel Heart Rate formula whenever live BPM is available
      if (currentBpm && currentBpm >= 50) {
        calPerSecond = calculateHeartRateCaloriesPerSecond(currentBpm, age, weightKg, sex);
        method = 'heart_rate';
      } else {
        calPerSecond = calculateMETCaloriesPerSecond(activityType, cadence, weightKg);
        method = 'met';
      }

      accumulatedCaloriesRef.current += calPerSecond;
      setTotalCalories(Math.round(accumulatedCaloriesRef.current * 10) / 10);
      setActiveMethod(method);
      setBurnRateKcalPerHour(Math.round(calPerSecond * 3600));
    }, 1000);

    return () => clearInterval(timer);
  }, [isWorkoutActive, activityType, cadence, currentBpm, weightKg, age, sex]);

  return {
    totalCalories,
    burnRateKcalPerHour,
    activeMethod,
    resetCalories,
    setAccumulatedCalories,
  };
}
