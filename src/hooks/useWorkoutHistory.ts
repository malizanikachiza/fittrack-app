import { useEffect, useState } from 'react';
import { DailySummary, WorkoutSession } from '../types/fitness';

const STORAGE_KEY = 'fittrack_workout_sessions_v1';

// Initial mock data if empty, giving immediate rich visuals on first launch
const SAMPLE_SESSIONS: WorkoutSession[] = [
  {
    id: 'sample-1',
    startTime: Date.now() - 86400000 * 2 - 3600000,
    endTime: Date.now() - 86400000 * 2,
    durationSeconds: 2700, // 45 min
    activityType: 'running',
    steps: 5400,
    cadence: 155,
    distanceMeters: 4200,
    calories: 410,
    calorieCalculationMethod: 'heart_rate',
    avgBpm: 152,
    maxBpm: 174,
    heartRateSamples: [
      { timestamp: 0, bpm: 120 },
      { timestamp: 600, bpm: 145 },
      { timestamp: 1200, bpm: 156 },
      { timestamp: 1800, bpm: 162 },
      { timestamp: 2400, bpm: 158 },
    ],
  },
  {
    id: 'sample-2',
    startTime: Date.now() - 86400000 * 1 - 2400000,
    endTime: Date.now() - 86400000 * 1,
    durationSeconds: 1800, // 30 min
    activityType: 'walking',
    steps: 3200,
    cadence: 108,
    distanceMeters: 2300,
    calories: 165,
    calorieCalculationMethod: 'met',
    avgBpm: 98,
    maxBpm: 115,
    heartRateSamples: [],
  },
  {
    id: 'sample-3',
    startTime: Date.now() - 86400000 * 3 - 3000000,
    endTime: Date.now() - 86400000 * 3,
    durationSeconds: 2400, // 40 min
    activityType: 'gym',
    steps: 1100,
    cadence: 45,
    distanceMeters: 800,
    calories: 280,
    calorieCalculationMethod: 'heart_rate',
    avgBpm: 132,
    maxBpm: 160,
    heartRateSamples: [],
  },
];

export function useWorkoutHistory() {
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => {
    if (typeof window === 'undefined') return SAMPLE_SESSIONS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load workout sessions from localStorage:', e);
    }
    return SAMPLE_SESSIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save workout sessions to localStorage:', e);
    }
  }, [sessions]);

  const addSession = (session: WorkoutSession) => {
    setSessions((prev) => [session, ...prev]);
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const clearAllSessions = () => {
    setSessions([]);
  };

  const loadSampleSessions = () => {
    setSessions(SAMPLE_SESSIONS);
  };

  // Aggregated totals for today
  const getTodaySummary = (liveSteps = 0, liveCalories = 0): DailySummary => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const todaySessions = sessions.filter((s) => s.startTime >= todayMs);

    const savedSteps = todaySessions.reduce((acc, s) => acc + s.steps, 0);
    const savedCalories = todaySessions.reduce((acc, s) => acc + s.calories, 0);
    const savedDurationSecs = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const savedDistanceMeters = todaySessions.reduce((acc, s) => acc + s.distanceMeters, 0);

    return {
      date: new Date().toISOString().split('T')[0],
      steps: savedSteps + liveSteps,
      calories: Math.round((savedCalories + liveCalories) * 10) / 10,
      activeMinutes: Math.round(savedDurationSecs / 60),
      distanceKm: Math.round(((savedDistanceMeters) / 1000) * 100) / 100,
    };
  };

  // Weekly aggregate data for Recharts (past 7 days)
  const getWeeklyData = (liveSteps = 0, liveCalories = 0) => {
    const days: {
      day: string;
      fullDate: string;
      steps: number;
      calories: number;
      activeMinutes: number;
    }[] = [];

    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const startOfDay = d.getTime();
      const endOfDay = startOfDay + 86400000;

      const daySessions = sessions.filter(
        (s) => s.startTime >= startOfDay && s.startTime < endOfDay
      );

      let steps = daySessions.reduce((acc, s) => acc + s.steps, 0);
      let calories = daySessions.reduce((acc, s) => acc + s.calories, 0);
      let activeMinutes = Math.round(
        daySessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60
      );

      // Add live data to today
      if (i === 0) {
        steps += liveSteps;
        calories += liveCalories;
      }

      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
      days.push({
        day: dayName,
        fullDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        steps: Math.round(steps),
        calories: Math.round(calories),
        activeMinutes,
      });
    }

    return days;
  };

  return {
    sessions,
    addSession,
    deleteSession,
    clearAllSessions,
    loadSampleSessions,
    getTodaySummary,
    getWeeklyData,
  };
}
