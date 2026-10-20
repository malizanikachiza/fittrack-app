import { useEffect, useState } from 'react';
import { UserProfile } from '../types/fitness';

const DEFAULT_PROFILE: UserProfile = {
  age: 28,
  sex: 'male',
  heightCm: 175,
  weightKg: 70,
  dailyStepGoal: 10000,
  dailyCalorieGoal: 500,
  unitSystem: 'metric',
};

const STORAGE_KEY = 'fittrack_user_profile_v1';

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (typeof window === 'undefined') return DEFAULT_PROFILE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load user profile from localStorage:', e);
    }
    return DEFAULT_PROFILE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save user profile to localStorage:', e);
    }
  }, [profile]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
  };

  return {
    profile,
    updateProfile,
    resetProfile,
  };
}
