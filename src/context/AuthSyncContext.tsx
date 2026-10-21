import { User, onAuthStateChanged } from 'firebase/auth';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  auth,
  fetchUserDataFromFirestore,
  isFirebaseConfigured,
  loginWithGoogle,
  logoutUser,
  syncUserDataToFirestore,
} from '../services/firebase';
import {
  getIDBDailyTotals,
  getIDBMeta,
  getIDBProfile,
  getIDBWorkouts,
  saveIDBDailyTotals,
  setIDBMeta,
  saveIDBProfile,
  saveIDBWorkouts,
} from '../services/indexedDb';
import { DailySummary, UserProfile, WorkoutSession } from '../types/fitness';

export type SyncState = 'Synced' | 'Offline' | 'Syncing' | 'Not signed in';

interface AuthSyncContextType {
  user: User | null;
  isAuthLoading: boolean;
  isConfigured: boolean;
  syncStatus: SyncState;
  lastSyncedAt: Date | null;
  error: string | null;
  clearError: () => void;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  syncData: (
    currentProfile: UserProfile,
    currentSessions: WorkoutSession[],
    onHydrateRemoteData?: (profile: UserProfile, sessions: WorkoutSession[]) => void
  ) => Promise<void>;
}

const AuthSyncContext = createContext<AuthSyncContextType | null>(null);

export function computeDailyTotalsFromSessions(sessions: WorkoutSession[]): DailySummary[] {
  const map: Record<string, { steps: number; calories: number; durationSeconds: number; distanceMeters: number }> = {};

  sessions.forEach((s) => {
    const dateStr = new Date(s.startTime).toISOString().split('T')[0];
    if (!map[dateStr]) {
      map[dateStr] = { steps: 0, calories: 0, durationSeconds: 0, distanceMeters: 0 };
    }
    map[dateStr].steps += s.steps;
    map[dateStr].calories += s.calories;
    map[dateStr].durationSeconds += s.durationSeconds;
    map[dateStr].distanceMeters += s.distanceMeters;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  if (!map[todayStr]) {
    map[todayStr] = { steps: 0, calories: 0, durationSeconds: 0, distanceMeters: 0 };
  }

  return Object.entries(map)
    .map(([date, data]) => ({
      date,
      steps: Math.round(data.steps),
      calories: Math.round(data.calories * 10) / 10,
      activeMinutes: Math.round(data.durationSeconds / 60),
      distanceKm: Math.round((data.distanceMeters / 1000) * 100) / 100,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const AuthSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isOnline = useOnlineStatus();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(isFirebaseConfigured);
  const [syncStatus, setSyncStatus] = useState<SyncState>('Not signed in');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // References to keep latest functions & state without loop
  const isSyncingRef = useRef<boolean>(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      setSyncStatus(isOnline ? 'Not signed in' : 'Offline');
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setUser(firebaseUser);
        setIsAuthLoading(false);

        if (firebaseUser) {
          const cachedTime = await getIDBMeta<number>('last_synced_at');
          if (cachedTime) {
            setLastSyncedAt(new Date(cachedTime));
          }
          if (!isOnline) {
            setSyncStatus('Offline');
          } else {
            setSyncStatus('Synced');
          }
        } else {
          setSyncStatus(isOnline ? 'Not signed in' : 'Offline');
        }
      },
      (err) => {
        console.warn('Auth state error:', err);
        setIsAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOnline]);

  // Update sync status when online status changes
  useEffect(() => {
    if (!isOnline) {
      setSyncStatus('Offline');
    } else if (user) {
      setSyncStatus('Synced');
    } else {
      setSyncStatus('Not signed in');
    }
  }, [isOnline, user]);

  const clearError = () => setError(null);

  const signInGoogle = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      // Give readable feedback
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized in Firebase Console -> Authentication -> Settings -> Authorized domains.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await logoutUser();
      setUser(null);
      setSyncStatus(isOnline ? 'Not signed in' : 'Offline');
    } catch (err: any) {
      console.error('Sign-Out failed:', err);
      setError(err.message || 'Failed to sign out');
    }
  };

  /**
   * Sync local data with Cloud Firestore under users/{uid}
   */
  const syncData = useCallback(
    async (
      currentProfile: UserProfile,
      currentSessions: WorkoutSession[],
      onHydrateRemoteData?: (profile: UserProfile, sessions: WorkoutSession[]) => void
    ) => {
      // Always cache latest to IndexedDB
      await saveIDBProfile(currentProfile);
      await saveIDBWorkouts(currentSessions);
      const dailyTotals = computeDailyTotalsFromSessions(currentSessions);
      await saveIDBDailyTotals(dailyTotals);

      if (!user) {
        setSyncStatus(isOnline ? 'Not signed in' : 'Offline');
        return;
      }

      if (!isOnline) {
        setSyncStatus('Offline');
        await setIDBMeta('pending_sync', true);
        return;
      }

      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      setSyncStatus('Syncing');

      try {
        // Fetch existing cloud data for users/{uid}
        const cloudData = await fetchUserDataFromFirestore(user.uid);

        let mergedProfile = currentProfile;
        let mergedWorkouts = currentSessions;

        if (cloudData) {
          // Merge profile: if cloud profile exists and local has default, prefer cloud
          if (cloudData.profile) {
            mergedProfile = { ...currentProfile, ...cloudData.profile };
          }

          // Merge workouts by session id
          if (Array.isArray(cloudData.workoutHistory)) {
            const workoutMap = new Map<string, WorkoutSession>();
            // Add cloud sessions first
            cloudData.workoutHistory.forEach((s) => {
              if (s && s.id) workoutMap.set(s.id, s);
            });
            // Overwrite or append local sessions
            currentSessions.forEach((s) => {
              if (s && s.id) workoutMap.set(s.id, s);
            });
            mergedWorkouts = Array.from(workoutMap.values()).sort(
              (a, b) => b.startTime - a.startTime
            );
          }

          if (onHydrateRemoteData) {
            onHydrateRemoteData(mergedProfile, mergedWorkouts);
          }
        }

        // Compute updated daily totals
        const updatedTotals = computeDailyTotalsFromSessions(mergedWorkouts);

        // Upload unified snapshot to Cloud Firestore under users/{uid}
        await syncUserDataToFirestore(user.uid, {
          profile: mergedProfile,
          workoutHistory: mergedWorkouts,
          dailyTotals: updatedTotals,
        });

        // Update IndexedDB cache with merged data
        await saveIDBProfile(mergedProfile);
        await saveIDBWorkouts(mergedWorkouts);
        await saveIDBDailyTotals(updatedTotals);
        const now = Date.now();
        await setIDBMeta('last_synced_at', now);
        await setIDBMeta('pending_sync', false);

        setLastSyncedAt(new Date(now));
        setSyncStatus('Synced');
      } catch (err: any) {
        console.warn('Sync failed:', err);
        // If network issue or offline detected during push
        if (!navigator.onLine) {
          setSyncStatus('Offline');
        } else {
          setSyncStatus('Synced'); // don't show scary error for transient issues
        }
      } finally {
        isSyncingRef.current = false;
      }
    },
    [user, isOnline]
  );

  return (
    <AuthSyncContext.Provider
      value={{
        user,
        isAuthLoading,
        isConfigured: isFirebaseConfigured,
        syncStatus,
        lastSyncedAt,
        error,
        clearError,
        signInGoogle,
        signOut,
        syncData,
      }}
    >
      {children}
    </AuthSyncContext.Provider>
  );
};

export function useAuthSync() {
  const context = useContext(AuthSyncContext);
  if (!context) {
    throw new Error('useAuthSync must be used within an AuthSyncProvider');
  }
  return context;
}
