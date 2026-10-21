export type ActivityType = 'walking' | 'running' | 'gym';

export type Sex = 'male' | 'female' | 'other';

export interface UserProfile {
  age: number;
  sex: Sex;
  heightCm: number; // stored in cm
  weightKg: number; // stored in kg
  dailyStepGoal: number;
  dailyCalorieGoal: number;
  unitSystem: 'metric' | 'imperial'; // metric: cm/kg, imperial: in/lbs
}

export interface HeartRateZone {
  zone: number;
  name: string;
  minBpm: number;
  maxBpm: number;
  color: string;
  description: string;
}

export interface WorkoutSession {
  id: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  activityType: ActivityType;
  steps: number;
  cadence: number; // avg cadence
  distanceMeters: number;
  calories: number;
  calorieCalculationMethod: 'heart_rate' | 'met';
  avgBpm: number | null;
  maxBpm: number | null;
  heartRateSamples: { timestamp: number; bpm: number }[];
  note?: string;
  routePath?: { lat: number; lng: number }[];
}

export type HRSource = 'none' | 'bluetooth' | 'camera';

export interface DailySummary {
  date: string; // YYYY-MM-DD
  steps: number;
  calories: number;
  activeMinutes: number;
  distanceKm: number;
}

export interface WeeklyDayData {
  day: string;
  fullDate: string;
  steps: number;
  calories: number;
  activeMinutes: number;
}
