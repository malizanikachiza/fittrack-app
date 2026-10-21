import {
  Activity,
  AlertTriangle,
  Bluetooth,
  Camera,
  Compass,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  MapPin,
  Navigation,
  Pause,
  Play,
  Sliders,
  Square,
  Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ActivityRecognitionState } from '../hooks/useActivityRecognition';
import { BluetoothHeartRateState } from '../hooks/useBluetoothHeartRate';
import { CalorieBurnState } from '../hooks/useCalorieBurn';
import { CameraPPGState } from '../hooks/useCameraPPG';
import { DeviceMotionState } from '../hooks/useDeviceMotion';
import { LocationTrackerState } from '../hooks/useLocationTracker';
import { ActivityType, UserProfile } from '../types/fitness';
import {
  formatDuration,
  getCurrentZone,
  getHeartRateZones,
  getMETValue,
} from '../utils/formulas';
import { WorkoutMap } from './WorkoutMap';

interface WorkoutTabProps {
  isWorkoutActive: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  profile: UserProfile;
  motionState: DeviceMotionState;
  activityState: ActivityRecognitionState;
  bluetoothState: BluetoothHeartRateState;
  cameraPPGState: CameraPPGState;
  calorieState: CalorieBurnState;
  locationTracker: LocationTrackerState;
  hrSource: 'none' | 'bluetooth' | 'camera';
  onOpenHeartRateModal: () => void;
  rollingHrData: { time: string; bpm: number }[];
}

export const WorkoutTab: React.FC<WorkoutTabProps> = ({
  isWorkoutActive,
  isPaused,
  elapsedSeconds,
  onStart,
  onPause,
  onResume,
  onStop,
  profile,
  motionState,
  activityState,
  bluetoothState,
  cameraPPGState,
  calorieState,
  locationTracker,
  hrSource,
  onOpenHeartRateModal,
  rollingHrData,
}) => {
  const [showSensorDetails, setShowSensorDetails] = useState(false);
  const [showMap, setShowMap] = useState(true);

  // Active BPM
  const activeBpm =
    hrSource === 'bluetooth'
      ? bluetoothState.currentBpm
      : hrSource === 'camera'
      ? cameraPPGState.currentBpm
      : null;

  const currentZone = activeBpm ? getCurrentZone(activeBpm, profile.age) : null;
  const zones = useMemo(() => getHeartRateZones(profile.age), [profile.age]);

  // Formatted distance (prefers GPS distance if available & non-zero, otherwise stride estimation)
  const effectiveDistanceMeters =
    locationTracker.gpsDistanceMeters > 0
      ? locationTracker.gpsDistanceMeters
      : motionState.distanceMeters;

  const distanceFormatted =
    profile.unitSystem === 'imperial'
      ? `${(effectiveDistanceMeters * 0.000621371).toFixed(2)} mi`
      : `${(effectiveDistanceMeters / 1000).toFixed(2)} km`;

  const activities: { id: ActivityType; label: string; icon: typeof Activity }[] = [
    { id: 'walking', label: 'Walking', icon: Footprints },
    { id: 'running', label: 'Running', icon: Activity },
    { id: 'gym', label: 'Gym / Strength', icon: Dumbbell },
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Activity Segmented Control */}
      <div className="p-1.5 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-center justify-between shadow-sm">
        <div className="flex gap-1.5 flex-1">
          {activities.map((act) => {
            const Icon = act.icon;
            const isSelected = activityState.currentActivity === act.id;
            return (
              <button
                key={act.id}
                onClick={() => activityState.setManualActivity(act.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate">{act.label}</span>
              </button>
            );
          })}
        </div>

        {/* Auto mode indicator button */}
        {activityState.isManualOverride ? (
          <button
            onClick={activityState.resetToAuto}
            className="ml-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-medium border border-slate-700 shrink-0 transition cursor-pointer"
            title="Switch back to automatic sensor classification"
          >
            Manual Mode
          </button>
        ) : (
          <span
            className="ml-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium shrink-0"
            title="Classifying via accelerometer variance & cadence"
          >
            Auto Detect
          </span>
        )}
      </div>

      {/* Main Timer Display */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 text-center relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isWorkoutActive
                ? isPaused
                  ? 'bg-amber-400'
                  : 'bg-emerald-400 animate-pulse'
                : 'bg-slate-600'
            }`}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {isWorkoutActive
              ? isPaused
                ? 'Workout Paused'
                : `${activityState.currentActivity} Session`
              : 'Workout Ready'}
          </span>
        </div>

        {/* Monospace High-Contrast Timer */}
        <div className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white font-mono my-2 selection:bg-emerald-500">
          {formatDuration(elapsedSeconds)}
        </div>

        <div className="flex items-center justify-center gap-3 text-xs text-slate-400 mt-2 font-mono">
          <span>Cadence: <strong className="text-white">{motionState.cadence}</strong> spm</span>
          <span className="text-slate-600">·</span>
          <span>
            MET: <strong className="text-white">{getMETValue(activityState.currentActivity, motionState.cadence).toFixed(1)}</strong>
          </span>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* 1. Steps Card */}
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-emerald-400" />
              <span>Steps</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-medium">
              {motionState.cadence} spm
            </span>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight pt-1">
            {motionState.steps.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Peak detect {motionState.steps > 0 ? 'active' : 'ready'}
          </div>
        </div>

        {/* 2. Heart Rate Card */}
        <div
          onClick={onOpenHeartRateModal}
          className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 space-y-1 transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Heart
                className={`w-3.5 h-3.5 ${
                  activeBpm
                    ? 'text-rose-500 fill-rose-500 animate-pulse'
                    : 'text-rose-400'
                }`}
              />
              <span>Heart Rate</span>
            </span>
            {currentZone && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded text-slate-950 font-mono"
                style={{ backgroundColor: currentZone.color }}
              >
                Z{currentZone.zone}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight pt-1 flex items-baseline gap-1">
            <span>{activeBpm ? activeBpm : '--'}</span>
            <span className="text-xs font-normal text-slate-400 font-sans">BPM</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
            {hrSource === 'bluetooth' ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Bluetooth className="w-3 h-3" /> BLE Connected
              </span>
            ) : hrSource === 'camera' ? (
              <span className="text-amber-400 flex items-center gap-1">
                <Camera className="w-3 h-3" /> Camera PPG
              </span>
            ) : (
              <span className="text-slate-400 group-hover:text-emerald-400 transition">
                Tap to connect BLE / PPG
              </span>
            )}
          </div>
        </div>

        {/* 3. Distance Card */}
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Distance</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
              {locationTracker.gpsDistanceMeters > 0 ? 'GPS' : profile.unitSystem}
            </span>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight pt-1">
            {distanceFormatted}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {locationTracker.gpsDistanceMeters > 0
              ? `${locationTracker.routePath.length} GPS trace points`
              : 'Estimated via stride'}
          </div>
        </div>

        {/* 4. Calories Card */}
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Calories</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {calorieState.activeMethod === 'heart_rate' ? 'HR Formula' : 'MET'}
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tracking-tight pt-1 flex items-baseline gap-1">
            <span>{Math.round(calorieState.totalCalories)}</span>
            <span className="text-xs font-normal text-slate-400 font-sans">kcal</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono truncate">
            ~{calorieState.burnRateKcalPerHour} kcal/hr
          </div>
        </div>
      </div>

      {/* GPS Route Tracing Map Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Route Tracing & Live Map
            </span>
          </div>
          <button
            onClick={() => setShowMap(!showMap)}
            className="text-xs text-slate-400 hover:text-white transition cursor-pointer font-medium"
          >
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </div>

        {showMap && (
          <WorkoutMap
            currentLocation={locationTracker.currentLocation}
            routePath={locationTracker.routePath}
            accuracy={locationTracker.accuracy}
            speed={locationTracker.speed}
            isTracking={locationTracker.isTracking}
            isSimulating={locationTracker.isSimulating}
            onStartSimulation={locationTracker.startSimulation}
            onStopSimulation={locationTracker.stopSimulation}
          />
        )}
      </div>

      {/* Heart Rate Rolling Chart & Zones */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span className="text-xs font-bold text-white">Heart Rate Zones</span>
          </div>
          {currentZone && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded text-slate-950 font-mono"
              style={{ backgroundColor: currentZone.color }}
            >
              Zone {currentZone.zone} ({currentZone.minBpm}–{currentZone.maxBpm} BPM)
            </span>
          )}
        </div>

        {/* Zone bars preview */}
        <div className="grid grid-cols-5 gap-1 text-center">
          {zones.map((z) => {
            const isCurrent = currentZone?.zone === z.zone;
            return (
              <div
                key={z.zone}
                className={`py-1.5 px-1 rounded-lg border transition ${
                  isCurrent
                    ? 'border-white bg-slate-800 font-bold'
                    : 'border-slate-800 bg-slate-900/60 opacity-60'
                }`}
              >
                <div
                  className="w-full h-1.5 rounded-full mb-1"
                  style={{ backgroundColor: z.color }}
                />
                <div className="text-[10px] text-white font-mono leading-none">
                  Z{z.zone}
                </div>
                <div className="text-[9px] text-slate-400 truncate mt-0.5">
                  {z.name.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rolling Area Chart */}
        <div className="h-32 w-full pt-2">
          {rollingHrData.length > 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rollingHrData}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  itemStyle={{ color: '#f43f5e' }}
                  formatter={(val: any) => [
                    `${val ?? 0} BPM`,
                    'Heart Rate',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="bpm"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#hrGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl p-4">
              <Heart className="w-4 h-4 text-slate-600 mb-1" />
              <span>Connect BLE strap or Camera PPG to view live heart rate curve</span>
            </div>
          )}
        </div>
      </div>

      {/* Sensor Status & Testing Controls Drawer */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-sm">
        <button
          onClick={() => setShowSensorDetails(!showSensorDetails)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Sensor Telemetry & Simulation Controls</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">
            {showSensorDetails ? 'Hide' : 'Configure'}
          </span>
        </button>

        {showSensorDetails && (
          <div className="p-4 pt-2 border-t border-slate-800 space-y-3 text-xs">
            {/* iOS Sensor Permission prompt */}
            {motionState.permissionState === 'prompt' && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>iOS Motion Permission</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Safari requires one tap to activate the DeviceMotion accelerometer.
                </p>
                <button
                  onClick={motionState.requestPermission}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer transition shadow-sm"
                >
                  Allow Motion Sensors
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Acc Magnitude</span>
                <span className="text-white font-bold">{motionState.rawMagnitude} m/s²</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Variance (σ²)</span>
                <span className="text-white font-bold">{motionState.magnitudeVariance}</span>
              </div>
            </div>

            {/* Simulation controls for tester / desktop environment */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Sensor Testing Mode</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    if (motionState.isSimulating) {
                      motionState.stopSimulation();
                    } else {
                      motionState.startSimulation(110);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition border cursor-pointer ${
                    motionState.isSimulating
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-slate-800'
                  }`}
                >
                  {motionState.isSimulating ? 'Stop Walking Sim' : 'Simulate Walking (110 spm)'}
                </button>

                <button
                  onClick={() => {
                    if (motionState.isSimulating) {
                      motionState.stopSimulation();
                    } else {
                      motionState.startSimulation(160);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs border border-slate-800 transition cursor-pointer"
                >
                  Simulate Run (160 spm)
                </button>

                <button
                  onClick={motionState.manualStep}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs border border-slate-800 transition cursor-pointer"
                >
                  +1 Step Tap
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Bottom Control Buttons */}
      <div className="pt-2">
        {!isWorkoutActive ? (
          <button
            onClick={onStart}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/20 transition-transform active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>START WORKOUT</span>
          </button>
        ) : (
          <div className="flex gap-3">
            {isPaused ? (
              <button
                onClick={onResume}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex-1 py-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer shadow-md"
              >
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={onStop}
              className="flex-1 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-600/20 transition-transform active:scale-[0.98] cursor-pointer"
            >
              <Square className="w-5 h-5 fill-white" />
              <span>Finish</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
