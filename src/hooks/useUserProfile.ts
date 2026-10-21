import { useEffect, useState } from 'react';
import { getIDBProfile, saveIDBProfile } from '../services/indexedDb';
import { UserProfile } from '../types/fitness';

export const DEFAULT_PROFILE: UserProfile = {
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

  // On mount, check if IndexedDB has newer profile
  useEffect(() => {
    let isMounted = true;
    getIDBProfile().then((idbProf) => {
      if (isMounted && idbProf) {
        setProfile((prev) => ({ ...prev, ...idbProf }));
      } else if (isMounted) {
        // Seed IndexedDB with current profile
        saveIDBProfile(profile);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Save to both IndexedDB and localStorage whenever profile changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      saveIDBProfile(profile);
    } catch (e) {
      console.warn('Failed to save user profile:', e);
    }
  }, [profile]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
  };

  const hydrateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  return {
    profile,
    updateProfile,
    resetProfile,
    hydrateProfile,
  };
}
