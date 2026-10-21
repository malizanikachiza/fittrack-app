import confetti from 'canvas-confetti';
import {
  Activity,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  MapPin,
  Navigation,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ActivityType, WorkoutSession } from '../types/fitness';
import {
  formatDuration,
  getCurrentZone,
  getHeartRateZones,
} from '../utils/formulas';
import { WorkoutMap } from './WorkoutMap';

interface SessionSummaryModalProps {
  session: WorkoutSession | null;
  age: number;
  unitSystem: 'metric' | 'imperial';
  onSave: (session: WorkoutSession) => void;
  onDiscard: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  session,
  age,
  unitSystem,
  onSave,
  onDiscard,
}) => {
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (session) {
      setNote(session.note || '');
      // Fire celebratory confetti on session completion!
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#0ea5e9', '#f43f5e'],
        });
      } catch {
        // confetti fallback
      }
    }
  }, [session]);

  if (!session) return null;

  const distanceFormatted =
    unitSystem === 'imperial'
      ? `${(session.distanceMeters * 0.000621371).toFixed(2)} mi`
      : `${(session.distanceMeters / 1000).toFixed(2)} km`;

  const activityLabels: Record<ActivityType, { name: string; icon: typeof Activity }> = {
    walking: { name: 'Walking', icon: Footprints },
    running: { name: 'Running', icon: Activity },
    gym: { name: 'Gym / Strength', icon: Dumbbell },
  };

  const actInfo = activityLabels[session.activityType];
  const ActIcon = actInfo.icon;
  const zones = getHeartRateZones(age);

  // Group HR samples into zones if samples exist
  const zoneCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (session.heartRateSamples && session.heartRateSamples.length > 0) {
    session.heartRateSamples.forEach((s) => {
      const z = getCurrentZone(s.bpm, age);
      if (z) zoneCounts[z.zone] = (zoneCounts[z.zone] || 0) + 1;
    });
  }

  const totalSamples = session.heartRateSamples.length || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#0f172a] border border-slate-800 text-slate-100 shadow-2xl p-5 pb-8 sm:pb-6 relative flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Workout Complete</h2>
              <p className="text-xs text-slate-400">Session metrics & route summary</p>
            </div>
          </div>
          <button
            onClick={onDiscard}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Activity Tag */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
              <ActIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white capitalize">{actInfo.name} Workout</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {session.calorieCalculationMethod === 'heart_rate' ? 'HR Formula' : 'MET'}
          </span>
        </div>

        {/* 4 Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Duration */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Duration</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {formatDuration(session.durationSeconds)}
            </div>
          </div>

          {/* Calories */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Calories</span>
            </div>
            <div className="text-xl font-bold text-amber-400 font-mono">
              {session.calories} <span className="text-xs font-sans text-slate-400 font-normal">kcal</span>
            </div>
          </div>

          {/* Steps & Cadence */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Footprints className="w-3.5 h-3.5 text-emerald-400" />
              <span>Steps</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {session.steps.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Avg: {session.cadence} spm
            </div>
          </div>

          {/* Distance */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Distance</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {distanceFormatted}
            </div>
          </div>
        </div>

        {/* Heart Rate Overview */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Heart Rate Summary</span>
            </div>
            {session.avgBpm ? (
              <span className="text-[11px] text-rose-400 font-mono font-medium">
                Avg {session.avgBpm} · Peak {session.maxBpm || session.avgBpm} BPM
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">No sensor connected</span>
            )}
          </div>

          {/* Zone bar if HR samples exist */}
          {session.heartRateSamples && session.heartRateSamples.length > 0 && (
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-slate-800 flex overflow-hidden border border-slate-700/60">
                {zones.map((z) => {
                  const pct = Math.round(((zoneCounts[z.zone] || 0) / totalSamples) * 100);
                  if (pct === 0) return null;
                  return (
                    <div
                      key={z.zone}
                      style={{ width: `${pct}%`, backgroundColor: z.color }}
                      title={`Zone ${z.zone}: ${pct}%`}
                      className="h-full"
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Z1</span>
                <span>Z3</span>
                <span>Z5</span>
              </div>
            </div>
          )}
        </div>

        {/* Traced Route Map Preview if route recorded */}
        {session.routePath && session.routePath.length > 1 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Traced Route Map ({session.routePath.length} GPS points)</span>
            </div>
            <WorkoutMap
              currentLocation={session.routePath[session.routePath.length - 1]}
              routePath={session.routePath}
              accuracy={null}
              speed={null}
              isTracking={false}
              isSimulating={false}
              onStartSimulation={() => {}}
              onStopSimulation={() => {}}
              className="h-44 sm:h-48"
            />
          </div>
        )}

        {/* Optional Note */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Workout Note (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Morning outdoor run, felt great!"
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onDiscard}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard</span>
          </button>
          <button
            onClick={() => onSave({ ...session, note: note || undefined })}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Workout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
