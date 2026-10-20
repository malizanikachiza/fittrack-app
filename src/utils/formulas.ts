import { ActivityType, HeartRateZone, Sex, UserProfile } from '../types/fitness';

/**
 * Calculates maximum heart rate based on Gellish formula: 207 - (0.7 * age)
 */
export function calculateMaxHeartRate(age: number): number {
  return Math.round(207 - 0.7 * age);
}

/**
 * Calculates the 5 standard heart rate zones based on max heart rate
 */
export function getHeartRateZones(age: number): HeartRateZone[] {
  const maxHr = calculateMaxHeartRate(age);

  return [
    {
      zone: 1,
      name: 'Recovery',
      minBpm: Math.round(maxHr * 0.5),
      maxBpm: Math.round(maxHr * 0.6) - 1,
      color: '#38bdf8', // sky-400
      description: 'Active recovery, warm-up, and aerobic conditioning.',
    },
    {
      zone: 2,
      name: 'Fat Burn',
      minBpm: Math.round(maxHr * 0.6),
      maxBpm: Math.round(maxHr * 0.7) - 1,
      color: '#10b981', // emerald-500
      description: 'Long slow endurance, builds base fitness and burns fat.',
    },
    {
      zone: 3,
      name: 'Aerobic',
      minBpm: Math.round(maxHr * 0.7),
      maxBpm: Math.round(maxHr * 0.8) - 1,
      color: '#f59e0b', // amber-500
      description: 'Cardiovascular training, improves aerobic endurance.',
    },
    {
      zone: 4,
      name: 'Anaerobic',
      minBpm: Math.round(maxHr * 0.8),
      maxBpm: Math.round(maxHr * 0.9) - 1,
      color: '#f97316', // orange-500
      description: 'High intensity threshold, raises lactate tolerance.',
    },
    {
      zone: 5,
      name: 'Peak / VO2',
      minBpm: Math.round(maxHr * 0.9),
      maxBpm: maxHr + 20,
      color: '#f43f5e', // rose-500
      description: 'Maximum exertion, interval sprints and power development.',
    },
  ];
}

/**
 * Determines which zone a given BPM belongs to
 */
export function getCurrentZone(bpm: number, age: number): HeartRateZone | null {
  if (bpm <= 40) return null;
  const zones = getHeartRateZones(age);
  for (let i = zones.length - 1; i >= 0; i--) {
    if (bpm >= zones[i].minBpm) {
      return zones[i];
    }
  }
  return zones[0];
}

/**
 * Estimates stride length in meters based on height and activity type
 * Biomechanical benchmark: Walking is ~0.415 * height; Running is ~0.45 * height
 */
export function estimateStrideLengthMeters(heightCm: number, activity: ActivityType): number {
  const heightMeters = heightCm / 100;
  if (activity === 'running') {
    return heightMeters * 0.45;
  }
  if (activity === 'walking') {
    return heightMeters * 0.415;
  }
  // Gym / stationary
  return heightMeters * 0.38;
}

/**
 * Determines MET value based on activity type and cadence (steps per minute)
 * Walking: 3.0 - 4.5 MET (default 3.5)
 * Running: 8.0 - 10.0 MET (default 9.0)
 * Gym: 5.0 - 6.0 MET (default 5.5)
 */
export function getMETValue(activity: ActivityType, cadence: number): number {
  if (activity === 'walking') {
    if (cadence > 115) return 4.3; // brisk walk
    if (cadence < 85 && cadence > 0) return 3.0; // casual stroll
    return 3.5; // average walking
  }
  if (activity === 'running') {
    if (cadence > 165) return 10.5; // fast running / sprint
    if (cadence < 140 && cadence > 0) return 8.0; // light jog
    return 9.2; // moderate running
  }
  // Gym / stationary strength
  return 5.5;
}

/**
 * Calculates calories burned per second using standard MET formula:
 * Calories = MET * weight_kg * (seconds / 3600)
 */
export function calculateMETCaloriesPerSecond(
  activity: ActivityType,
  cadence: number,
  weightKg: number
): number {
  const met = getMETValue(activity, cadence);
  const caloriesPerHour = met * weightKg;
  return caloriesPerHour / 3600;
}

/**
 * Keytel Heart-Rate-Based Calorie Formula (Keytel et al., 2005)
 * Provides calories burned per minute using heart rate, age, weight, and sex.
 * Male: ((-55.0969 + (0.6309 * HR) + (0.1988 * Weight_kg) + (0.2017 * Age)) / 4.184)
 * Female: ((-20.4022 + (0.4472 * HR) - (0.1263 * Weight_kg) + (0.074 * Age)) / 4.184)
 */
export function calculateHeartRateCaloriesPerSecond(
  bpm: number,
  age: number,
  weightKg: number,
  sex: Sex
): number {
  if (bpm < 50) return 0;

  let calPerMin = 0;
  if (sex === 'male') {
    calPerMin = (-55.0969 + 0.6309 * bpm + 0.1988 * weightKg + 0.2017 * age) / 4.184;
  } else if (sex === 'female') {
    calPerMin = (-20.4022 + 0.4472 * bpm - 0.1263 * weightKg + 0.074 * age) / 4.184;
  } else {
    // Other / gender-neutral: mean of both formulas
    const male = (-55.0969 + 0.6309 * bpm + 0.1988 * weightKg + 0.2017 * age) / 4.184;
    const female = (-20.4022 + 0.4472 * bpm - 0.1263 * weightKg + 0.074 * age) / 4.184;
    calPerMin = (male + female) / 2;
  }

  // Prevent negative burn rate when HR is slightly low
  return Math.max(0, calPerMin / 60);
}

/**
 * Unit conversions
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54);
}

/**
 * Format duration in seconds into HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}
