import {
  Activity,
  AlertTriangle,
  Bluetooth,
  Camera,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
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
import { ActivityType, UserProfile } from '../types/fitness';
import {
  formatDuration,
  getCurrentZone,
  getHeartRateZones,
  getMETValue,
} from '../utils/formulas';

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
  hrSource,
  onOpenHeartRateModal,
  rollingHrData,
}) => {
  const [showSensorDetails, setShowSensorDetails] = useState(false);

  // Active BPM
  const activeBpm =
    hrSource === 'bluetooth'
      ? bluetoothState.currentBpm
      : hrSource === 'camera'
      ? cameraPPGState.currentBpm
      : null;

  const currentZone = activeBpm ? getCurrentZone(activeBpm, profile.age) : null;
  const zones = useMemo(() => getHeartRateZones(profile.age), [profile.age]);

  // Formatted distance
  const distanceFormatted =
    profile.unitSystem === 'imperial'
      ? `${(motionState.distanceMeters * 0.000621371).toFixed(2)} mi`
      : `${(motionState.distanceMeters / 1000).toFixed(2)} km`;

  const activities: { id: ActivityType; label: string; icon: typeof Activity }[] = [
    { id: 'walking', label: 'Walking', icon: Footprints },
    { id: 'running', label: 'Running', icon: Activity },
    { id: 'gym', label: 'Gym / Strength', icon: Dumbbell },
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Activity Segmented Control */}
      <div className="p-1 rounded-xl bg-[#0e1117] border border-[#1c2230] flex items-center justify-between">
        <div className="flex gap-1 flex-1">
          {activities.map((act) => {
            const Icon = act.icon;
            const isSelected = activityState.currentActivity === act.id;
            return (
              <button
                key={act.id}
                onClick={() => activityState.setManualActivity(act.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#151922] text-white border border-[#2a3449] shadow-sm'
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
            className="ml-1 px-2.5 py-1.5 rounded-lg bg-[#151922] hover:bg-[#1c2230] text-slate-300 text-[11px] font-medium border border-[#1c2230] shrink-0 transition cursor-pointer"
            title="Switch back to automatic sensor classification"
          >
            Manual Mode
          </button>
        ) : (
          <span
            className="ml-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium shrink-0"
            title="Classifying via accelerometer variance & cadence"
          >
            Auto Detect
          </span>
        )}
      </div>

      {/* Main Timer Display */}
      <div className="p-6 rounded-2xl bg-[#0e1117] border border-[#1c2230] text-center relative overflow-hidden shadow-xl">
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
                ? 'Paused'
                : `${activityState.currentActivity} Session`
              : 'Workout Ready'}
          </span>
        </div>

        {/* Monospace High-Contrast Timer */}
        <div className="text-5xl font-bold tracking-tight text-white font-mono my-1 selection:bg-emerald-500">
          {formatDuration(elapsedSeconds)}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-2 font-mono">
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
        <div className="p-4 rounded-2xl bg-[#0e1117] border border-[#1c2230] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-slate-400" />
              <span>Steps</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-medium">
              {motionState.cadence} spm
            </span>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight pt-1">
            {motionState.steps.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Stride: {Math.round(profile.heightCm * 0.415)} cm
          </div>
        </div>

        {/* 2. Heart Rate Card */}
        <div
          onClick={onOpenHeartRateModal}
          className="p-4 rounded-2xl bg-[#0e1117] border border-[#1c2230] hover:border-[#2a3449] space-y-1 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Heart
                className={`w-3.5 h-3.5 ${
                  activeBpm ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-slate-400'
                }`}
              />
              <span>Heart Rate</span>
            </span>
            {currentZone ? (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded text-slate-950 font-mono"
                style={{ backgroundColor: currentZone.color }}
              >
                Z{currentZone.zone}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium hover:text-white">
                Pair Sensor
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tracking-tight pt-1 flex items-baseline gap-1">
            <span>{activeBpm || '--'}</span>
            <span className="text-xs font-normal text-slate-400 font-sans">BPM</span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {hrSource === 'bluetooth' ? (
              <span className="text-cyan-400 flex items-center gap-1">
                <Bluetooth className="w-3 h-3" /> BLE Connected
              </span>
            ) : hrSource === 'camera' ? (
              <span className="text-amber-400 flex items-center gap-1">
                <Camera className="w-3 h-3" /> Camera PPG
              </span>
            ) : (
              <span className="text-slate-400 hover:text-white">Tap to connect BLE / PPG</span>
            )}
          </div>
        </div>

        {/* 3. Distance Card */}
        <div className="p-4 rounded-2xl bg-[#0e1117] border border-[#1c2230] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-slate-400" />
              <span>Distance</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              {profile.unitSystem}
            </span>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight pt-1">
            {distanceFormatted}
          </div>
          <div className="text-[11px] text-slate-400">
            Estimated via stride
          </div>
        </div>

        {/* 4. Calories Card */}
        <div className="p-4 rounded-2xl bg-[#0e1117] border border-[#1c2230] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-slate-400" />
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
          <div className="text-[11px] text-slate-400 font-mono">
            ~{calorieState.burnRateKcalPerHour} kcal/hr
          </div>
        </div>
      </div>

      {/* Heart Rate Rolling Chart & Zones */}
      <div className="p-4 rounded-2xl bg-[#0e1117] border border-[#1c2230] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
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

        {/* 5-Zone horizontal indicator bar */}
        <div className="space-y-1.5">
          <div className="h-2 w-full bg-[#151922] rounded-full flex overflow-hidden border border-[#1c2230]">
            {zones.map((zone) => {
              const isActive = currentZone?.zone === zone.zone;
              return (
                <div
                  key={zone.zone}
                  className={`flex-1 transition-all ${
                    isActive ? 'opacity-100 ring-2 ring-white z-10' : 'opacity-40 hover:opacity-60'
                  }`}
                  style={{ backgroundColor: zone.color }}
                  title={`Zone ${zone.zone} (${zone.name}): ${zone.minBpm}-${zone.maxBpm} BPM`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
            <span>Z1 ({zones[0].minBpm})</span>
            <span>Z2 ({zones[1].minBpm})</span>
            <span>Z3 ({zones[2].minBpm})</span>
            <span>Z4 ({zones[3].minBpm})</span>
            <span>Z5 ({zones[4].minBpm}+)</span>
          </div>
        </div>

        {/* Live Recharts Area chart */}
        <div className="h-28 w-full pt-1">
          {rollingHrData.length > 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rollingHrData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis
                  domain={['dataMin - 10', 'dataMax + 10']}
                  stroke="#475569"
                  fontSize={9}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0e1117',
                    borderColor: '#1c2230',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  itemStyle={{ color: '#f43f5e' }}
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
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-[#1c2230] rounded-xl p-4">
              <Heart className="w-4 h-4 text-slate-600 mb-1" />
              <span>Connect BLE or Camera PPG to view real-time heart rate curve</span>
            </div>
          )}
        </div>
      </div>

      {/* Sensor Status & Testing Controls Drawer */}
      <div className="rounded-xl bg-[#0e1117] border border-[#1c2230] overflow-hidden">
        <button
          onClick={() => setShowSensorDetails(!showSensorDetails)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Sensor Telemetry & Simulation Controls</span>
          </div>
          <span className="text-[11px] text-emerald-400">
            {showSensorDetails ? 'Hide' : 'Configure'}
          </span>
        </button>

        {showSensorDetails && (
          <div className="p-4 pt-2 border-t border-[#1c2230] space-y-3 text-xs">
            {/* iOS Sensor Permission prompt */}
            {motionState.permissionState === 'prompt' && (
              <div className="p-3 rounded-lg bg-[#151922] border border-[#1c2230] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>iOS Motion Permission</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Safari requires one tap to activate the DeviceMotion accelerometer.
                </p>
                <button
                  onClick={motionState.requestPermission}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Allow Motion Sensors
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
              <div className="p-2.5 rounded-lg bg-[#151922] border border-[#1c2230]">
                <span className="text-slate-400 block text-[10px]">Acc Magnitude</span>
                <span className="text-white font-bold">{motionState.rawMagnitude} m/s²</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#151922] border border-[#1c2230]">
                <span className="text-slate-400 block text-[10px]">Variance (σ²)</span>
                <span className="text-white font-bold">{motionState.magnitudeVariance}</span>
              </div>
            </div>

            {/* Simulation controls for tester / desktop environment */}
            <div className="space-y-2 pt-1 border-t border-[#1c2230]">
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
                      : 'bg-[#151922] hover:bg-[#1c2230] text-emerald-400 border-[#1c2230]'
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
                  className="px-3 py-1.5 rounded-lg bg-[#151922] hover:bg-[#1c2230] text-slate-200 font-medium text-xs border border-[#1c2230] transition cursor-pointer"
                >
                  Simulate Run (160 spm)
                </button>

                <button
                  onClick={motionState.manualStep}
                  className="px-3 py-1.5 rounded-lg bg-[#151922] hover:bg-[#1c2230] text-slate-200 font-medium text-xs border border-[#1c2230] transition cursor-pointer"
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
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition-transform active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>START WORKOUT</span>
          </button>
        ) : (
          <div className="flex gap-3">
            {isPaused ? (
              <button
                onClick={onResume}
                className="flex-1 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex-1 py-4 rounded-2xl bg-[#151922] hover:bg-[#1c2230] text-amber-400 border border-[#1c2230] font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={onStop}
              className="flex-1 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-transform active:scale-[0.98] cursor-pointer"
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
