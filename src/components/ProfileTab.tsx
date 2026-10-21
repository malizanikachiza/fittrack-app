import {
  Check,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Info,
  RotateCcw,
  Ruler,
  Scale,
  Settings,
  Target,
} from 'lucide-react';
import React, { useState } from 'react';
import { Sex, UserProfile } from '../types/fitness';
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
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onResetProfile: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  onUpdateProfile,
  onResetProfile,
}) => {
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

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

  return (
    <div className="space-y-4 pb-20">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">User Profile</h1>
          <p className="text-xs text-slate-400">Personalize biometric & stride calculations</p>
        </div>

        {showSavedFeedback && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-xl border border-emerald-500/30 shadow-sm">
            <Check className="w-3.5 h-3.5" />
            <span>Saved</span>
          </span>
        )}
      </div>

      {/* Unit System Toggle */}
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

      {/* Calculated Biometric Reference */}
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
