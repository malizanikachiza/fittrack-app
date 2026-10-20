import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Navigation,
  Play,
} from 'lucide-react';
import React from 'react';
import { ActivityType, UserProfile, WorkoutSession } from '../types/fitness';
import { formatDuration } from '../utils/formulas';

interface TodayTabProps {
  profile: UserProfile;
  liveSteps: number;
  liveCalories: number;
  liveDurationSeconds: number;
  liveDistanceMeters: number;
  isWorkoutActive: boolean;
  todaySessions: WorkoutSession[];
  onStartWorkout: () => void;
  onSelectTab: (tab: 'today' | 'workout' | 'history' | 'profile') => void;
}

export const TodayTab: React.FC<TodayTabProps> = ({
  profile,
  liveSteps,
  liveCalories,
  liveDurationSeconds,
  liveDistanceMeters,
  isWorkoutActive,
  todaySessions,
  onStartWorkout,
  onSelectTab,
}) => {
  // Aggregate today's saved sessions + live workout
  const savedSteps = todaySessions.reduce((acc, s) => acc + s.steps, 0);
  const savedCalories = todaySessions.reduce((acc, s) => acc + s.calories, 0);
  const savedDurationSecs = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const savedDistanceMeters = todaySessions.reduce((acc, s) => acc + s.distanceMeters, 0);

  const totalSteps = savedSteps + liveSteps;
  const totalCalories = Math.round((savedCalories + liveCalories) * 10) / 10;
  const totalActiveMinutes = Math.round((savedDurationSecs + liveDurationSeconds) / 60);
  const totalDistanceMeters = savedDistanceMeters + liveDistanceMeters;

  const stepPercent = Math.min(100, Math.round((totalSteps / profile.dailyStepGoal) * 100));
  const caloriePercent = Math.min(100, Math.round((totalCalories / profile.dailyCalorieGoal) * 100));

  const distanceFormatted =
    profile.unitSystem === 'imperial'
      ? `${(totalDistanceMeters * 0.000621371).toFixed(2)} mi`
      : `${(totalDistanceMeters / 1000).toFixed(2)} km`;

  // SVG Ring calculation helper
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const stepStrokeDashoffset = circumference - (stepPercent / 100) * circumference;

  const innerRadius = 48;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const calStrokeDashoffset = innerCircumference - (caloriePercent / 100) * innerCircumference;

  return (
    <div className="space-y-4 pb-20">
      {/* Date Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Today's Activity</h1>
          <p className="text-xs text-slate-400">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        {isWorkoutActive ? (
          <button
            onClick={() => onSelectTab('workout')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Workout</span>
          </button>
        ) : (
          <button
            onClick={onStartWorkout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Start</span>
          </button>
        )}
      </div>

      {/* Dual Concentric Progress Ring Card */}
      <div className="p-6 rounded-2xl bg-[#0e1117] border border-[#1c2230] shadow-xl flex flex-col items-center sm:flex-row justify-around gap-6">
        {/* Concentric Progress Rings */}
        <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
            {/* Steps Track & Arc (Outer Ring) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#151922"
              strokeWidth="11"
              fill="transparent"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#10b981"
              strokeWidth="11"
              strokeDasharray={circumference}
              strokeDashoffset={stepStrokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />

            {/* Calories Track & Arc (Inner Ring) */}
            <circle
              cx="80"
              cy="80"
              r={innerRadius}
              stroke="#151922"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="80"
              cy="80"
              r={innerRadius}
              stroke="#f59e0b"
              strokeWidth="10"
              strokeDasharray={innerCircumference}
              strokeDashoffset={calStrokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Center stats */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <Footprints className="w-4 h-4 text-emerald-400 mb-0.5" />
            <span className="text-xl font-bold text-white font-mono leading-none tracking-tight">
              {totalSteps.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-1">
              Goal: {profile.dailyStepGoal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="w-full sm:w-auto flex-1 space-y-2.5">
          {/* Steps Progress Row */}
          <div className="p-3 rounded-xl bg-[#151922] border border-[#1c2230] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-white">Daily Steps</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {Math.max(0, profile.dailyStepGoal - totalSteps).toLocaleString()} remaining
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-400 font-mono">
                {stepPercent}%
              </div>
              {stepPercent >= 100 && (
                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-3 h-3" /> Met
                </div>
              )}
            </div>
          </div>

          {/* Calorie Progress Row */}
          <div className="p-3 rounded-xl bg-[#151922] border border-[#1c2230] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-white">Active Calories</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {Math.round(totalCalories)} / {profile.dailyCalorieGoal} kcal
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-amber-400 font-mono">
                {caloriePercent}%
              </div>
              {caloriePercent >= 100 && (
                <div className="text-[10px] text-amber-400 font-medium flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-3 h-3" /> Met
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Summary Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-[#0e1117] border border-[#1c2230] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Active Time</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {totalActiveMinutes} <span className="text-xs font-sans text-slate-400 font-normal">min</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {todaySessions.length} session{todaySessions.length === 1 ? '' : 's'} logged
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1117] border border-[#1c2230] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Navigation className="w-3.5 h-3.5 text-slate-400" />
            <span>Estimated Distance</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {distanceFormatted}
          </div>
          <div className="text-[11px] text-slate-400">
            Based on height & cadence
          </div>
        </div>
      </div>

      {/* Quick Launch Workout CTA Card */}
      <div className="p-4 rounded-2xl bg-[#0e1117] border border-[#1c2230] hover:border-[#2a3449] transition flex items-center justify-between">
        <div className="space-y-0.5 pr-3">
          <div className="text-sm font-bold text-white">
            Start a Workout
          </div>
          <p className="text-xs text-slate-400">
            Live cadence, heart rate via BLE/camera & calories
          </p>
        </div>
        <button
          onClick={onStartWorkout}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
        >
          <span>Start</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Today's Logged Sessions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Today's Sessions
          </span>
          {todaySessions.length > 0 && (
            <button
              onClick={() => onSelectTab('history')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              <span>View History</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {todaySessions.length > 0 ? (
          <div className="space-y-2">
            {todaySessions.map((session) => (
              <div
                key={session.id}
                className="p-3.5 rounded-xl bg-[#0e1117] border border-[#1c2230] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#151922] border border-[#1c2230] flex items-center justify-center text-slate-300">
                    {session.activityType === 'running' ? (
                      <Activity className="w-4 h-4 text-slate-200" />
                    ) : session.activityType === 'gym' ? (
                      <Dumbbell className="w-4 h-4 text-slate-200" />
                    ) : (
                      <Footprints className="w-4 h-4 text-slate-200" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white capitalize">
                      {session.activityType} Workout
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {formatDuration(session.durationSeconds)} · {session.steps.toLocaleString()} steps
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white font-mono">
                    {session.calories} kcal
                  </div>
                  {session.avgBpm && (
                    <div className="text-[11px] text-rose-400 font-mono flex items-center gap-1 justify-end">
                      <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                      <span>{session.avgBpm} bpm</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#0e1117] border border-dashed border-[#1c2230] text-center text-slate-500 text-xs">
            No completed workouts today yet. Start one above to fill your rings!
          </div>
        )}
      </div>
    </div>
  );
};
