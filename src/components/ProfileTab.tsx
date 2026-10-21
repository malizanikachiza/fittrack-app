import {
  AlertCircle,
  Check,
  CheckCircle2,
  Cloud,
  CloudOff,
  Database,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Info,
  LogOut,
  RefreshCw,
  RotateCcw,
  Ruler,
  Scale,
  Settings,
  Target,
  User as UserIcon,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuthSync } from '../context/AuthSyncContext';
import { Sex, UserProfile, WorkoutSession } from '../types/fitness';
import {
  calculateMaxHeartRate,
  cmToFeetInches,
  estimateStrideLengthMeters,
  feetInchesToCm,
  getHeartRateZones,
  kgToLbs,
  lbsToKg,
} from '../utils/formulas';

interface ProfileTabProps {
  profile: UserProfile;
  sessions: WorkoutSession[];
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onResetProfile: () => void;
  onHydrateProfile: (newProfile: UserProfile) => void;
  onHydrateSessions: (newSessions: WorkoutSession[]) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  sessions,
  onUpdateProfile,
  onResetProfile,
  onHydrateProfile,
  onHydrateSessions,
}) => {
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const {
    user,
    isAuthLoading,
    isConfigured,
    syncStatus,
    lastSyncedAt,
    error,
    clearError,
    signInGoogle,
    signOut,
    syncData,
  } = useAuthSync();

  const maxHeartRate = calculateMaxHeartRate(profile.age);
  const zones = getHeartRateZones(profile.age);
  const walkingStrideCm = Math.round(estimateStrideLengthMeters(profile.heightCm, 'walking') * 100);
  const runningStrideCm = Math.round(estimateStrideLengthMeters(profile.heightCm, 'running') * 100);

  const imperialHeight = cmToFeetInches(profile.heightCm);
  const imperialWeight = kgToLbs(profile.weightKg);

  const handleUnitSystemChange = (system: 'metric' | 'imperial') => {
    onUpdateProfile({ unitSystem: system });
    triggerSaved();
  };

  const triggerSaved = () => {
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInGoogle();
      // On successful sign in, trigger sync
      setTimeout(() => {
        syncData(profile, sessions, (remoteProf, remoteSess) => {
          onHydrateProfile(remoteProf);
          onHydrateSessions(remoteSess);
        });
      }, 300);
    } catch (e) {
      console.warn('Sign-in error in UI:', e);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await syncData(profile, sessions, (remoteProf, remoteSess) => {
        onHydrateProfile(remoteProf);
        onHydrateSessions(remoteSess);
      });
    } finally {
      setIsManualSyncing(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Title & Feedback */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">User Profile</h1>
          <p className="text-xs text-slate-400">Personalize biometrics, account & cloud sync</p>
        </div>

        {showSavedFeedback && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-xl border border-emerald-500/30 shadow-sm">
            <Check className="w-3.5 h-3.5" />
            <span>Saved</span>
          </span>
        )}
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Authentication Notice</span>
              <span>{error}</span>
            </div>
          </div>
          <button
            onClick={clearError}
            className="text-rose-400 hover:text-white font-bold px-1.5 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Firebase Cloud Sync & Google Account Card */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Cloud Backup & Sync</h2>
          </div>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-1.5">
            {syncStatus === 'Synced' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Synced</span>
              </span>
            )}

            {syncStatus === 'Offline' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm">
                <CloudOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </span>
            )}

            {syncStatus === 'Syncing' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing</span>
              </span>
            )}

            {syncStatus === 'Not signed in' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                <Database className="w-3 h-3 text-slate-400" />
                <span>Local Cache (IndexedDB)</span>
              </span>
            )}
          </div>
        </div>

        {/* User Account State */}
        {user ? (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-11 h-11 rounded-full border border-emerald-500/40 object-cover shadow"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <span className="text-sm font-bold text-white block">
                    {user.displayName || 'Google Athlete'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono block truncate max-w-[200px]">
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Sign out button */}
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Sign out</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Synced to Cloud Firestore (<code className="text-slate-300">users/{'{uid}'}</code>)</span>
              </span>

              <button
                onClick={handleManualSync}
                disabled={isManualSyncing}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isManualSyncing ? 'animate-spin' : ''}`} />
                <span>{isManualSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Sign in with Google to synchronize your biometric profile, workout history, and daily totals to Cloud Firestore under <code className="text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">users/{'{uid}'}</code>. IndexedDB is used as your local offline cache so you never lose workout data.
            </p>

            {/* Google Sign-in Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn || isAuthLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition shadow cursor-pointer disabled:opacity-60"
            >
              {isSigningIn ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.1 3.66-5.2 3.66-9.12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.4 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.6 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                  />
                </svg>
              )}
              <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
            </button>

            {!isConfigured && (
              <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-400">
                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  Firebase config loaded from environment (<code className="text-slate-300">VITE_FIREBASE_API_KEY</code>, etc.). Data is cached locally in IndexedDB when offline.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Measurement Units Toggle */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-center justify-between shadow-sm">
        <span className="text-xs font-semibold text-slate-300">Measurement Units</span>
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium">
          <button
            onClick={() => handleUnitSystemChange('metric')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              profile.unitSystem === 'metric'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Metric (cm, kg)
          </button>
          <button
            onClick={() => handleUnitSystemChange('imperial')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              profile.unitSystem === 'imperial'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Imperial (ft/in, lbs)
          </button>
        </div>
      </div>

      {/* Main Profile Form Card */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4 shadow-xl">
        <div className="grid grid-cols-2 gap-3.5">
          {/* Age */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Age (Years)
            </label>
            <input
              type="number"
              min={12}
              max={110}
              value={profile.age}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 12 && val <= 110) {
                  onUpdateProfile({ age: val });
                  triggerSaved();
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Biological Sex */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Biological Sex
            </label>
            <select
              value={profile.sex}
              onChange={(e) => {
                onUpdateProfile({ sex: e.target.value as Sex });
                triggerSaved();
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other / Neutral</option>
            </select>
          </div>

          {/* Height */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Height ({profile.unitSystem === 'metric' ? 'cm' : 'ft & in'})
            </label>
            {profile.unitSystem === 'metric' ? (
              <input
                type="number"
                min={100}
                max={250}
                value={profile.heightCm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > 50 && val < 270) {
                    onUpdateProfile({ heightCm: val });
                    triggerSaved();
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  min={3}
                  max={8}
                  placeholder="ft"
                  value={imperialHeight.feet}
                  onChange={(e) => {
                    const feet = Number(e.target.value);
                    const cm = feetInchesToCm(feet, imperialHeight.inches);
                    onUpdateProfile({ heightCm: cm });
                    triggerSaved();
                  }}
                  className="w-1/2 px-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white font-mono text-center focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  min={0}
                  max={11}
                  placeholder="in"
                  value={imperialHeight.inches}
                  onChange={(e) => {
                    const inches = Number(e.target.value);
                    const cm = feetInchesToCm(imperialHeight.feet, inches);
                    onUpdateProfile({ heightCm: cm });
                    triggerSaved();
                  }}
                  className="w-1/2 px-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white font-mono text-center focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Weight ({profile.unitSystem === 'metric' ? 'kg' : 'lbs'})
            </label>
            {profile.unitSystem === 'metric' ? (
              <input
                type="number"
                min={30}
                max={250}
                value={profile.weightKg}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > 20 && val < 300) {
                    onUpdateProfile({ weightKg: val });
                    triggerSaved();
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            ) : (
              <input
                type="number"
                min={65}
                max={600}
                value={Math.round(imperialWeight)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > 50 && val < 700) {
                    const kg = lbsToKg(val);
                    onUpdateProfile({ weightKg: kg });
                    triggerSaved();
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            )}
          </div>

          {/* Daily Step Goal */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Daily Step Goal
            </label>
            <input
              type="number"
              step={500}
              min={1000}
              max={50000}
              value={profile.dailyStepGoal}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1000) {
                  onUpdateProfile({ dailyStepGoal: val });
                  triggerSaved();
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Daily Calorie Goal */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Daily Calorie Goal (kcal)
            </label>
            <input
              type="number"
              step={50}
              min={100}
              max={5000}
              value={profile.dailyCalorieGoal}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 100) {
                  onUpdateProfile({ dailyCalorieGoal: val });
                  triggerSaved();
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Calculated Biometrics */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3 shadow-xl">
        <span className="text-xs font-semibold text-slate-300 block">
          Calculated Biometrics
        </span>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Max Heart Rate</span>
            <span className="text-base font-bold text-white font-mono">
              {maxHeartRate} <span className="text-xs font-normal text-slate-400 font-sans">BPM</span>
            </span>
            <span className="text-[10px] text-slate-500 block">Gellish (207 - 0.7 × age)</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Calculated Strides</span>
            <span className="text-xs font-medium text-slate-200 block font-mono">
              Walk: {walkingStrideCm} cm
            </span>
            <span className="text-xs font-medium text-slate-200 block font-mono">
              Run: {runningStrideCm} cm
            </span>
          </div>
        </div>

        {/* Zones List */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-medium text-slate-400 block">
            Target Heart Rate Zones:
          </span>
          <div className="space-y-1.5">
            {zones.map((zone) => (
              <div
                key={zone.zone}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: zone.color }}
                  />
                  <span className="font-medium text-slate-200">
                    Zone {zone.zone} · {zone.name}
                  </span>
                </div>
                <span className="font-mono text-slate-400">
                  {zone.minBpm} – {zone.maxBpm} BPM
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reset Profile to Default */}
      <div className="pt-2 text-center">
        <button
          onClick={() => {
            if (window.confirm('Reset profile settings back to default values?')) {
              onResetProfile();
              triggerSaved();
            }
          }}
          className="text-xs text-slate-500 hover:text-slate-300 inline-flex items-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Defaults</span>
        </button>
      </div>
    </div>
  );
};
