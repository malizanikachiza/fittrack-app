import {
  Activity,
  BarChart2,
  Calendar,
  Clock,
  Dumbbell,
  Filter,
  Flame,
  Footprints,
  Heart,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ActivityType, UserProfile, WorkoutSession } from '../types/fitness';
import { formatDuration } from '../utils/formulas';

interface HistoryTabProps {
  sessions: WorkoutSession[];
  weeklyData: {
    day: string;
    fullDate: string;
    steps: number;
    calories: number;
    activeMinutes: number;
  }[];
  profile: UserProfile;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onLoadSamples: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  sessions,
  weeklyData,
  profile,
  onDeleteSession,
  onClearAll,
  onLoadSamples,
}) => {
  const [activeMetric, setActiveMetric] = useState<'steps' | 'calories' | 'activeMinutes'>('steps');
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');

  const metricConfig = {
    steps: {
      label: 'Steps',
      unit: 'steps',
      color: '#10b981',
      icon: Footprints,
    },
    calories: {
      label: 'Calories',
      unit: 'kcal',
      color: '#f59e0b',
      icon: Flame,
    },
    activeMinutes: {
      label: 'Active Minutes',
      unit: 'min',
      color: '#38bdf8',
      icon: Clock,
    },
  };

  const currentMetric = metricConfig[activeMetric];

  // Filtered session list
  const filteredSessions = useMemo(() => {
    if (filterType === 'all') return sessions;
    return sessions.filter((s) => s.activityType === filterType);
  }, [sessions, filterType]);

  // Weekly aggregate summary
  const weeklyTotalSteps = weeklyData.reduce((acc, d) => acc + d.steps, 0);
  const weeklyTotalCalories = weeklyData.reduce((acc, d) => acc + d.calories, 0);
  const weeklyTotalMinutes = weeklyData.reduce((acc, d) => acc + d.activeMinutes, 0);

  return (
    <div className="space-y-4 pb-20">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Workout History</h1>
          <p className="text-xs text-slate-400">Weekly progress & logged workouts</p>
        </div>

        {sessions.length === 0 && (
          <button
            onClick={onLoadSamples}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151922] hover:bg-[#1c2230] text-emerald-400 border border-[#1c2230] text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Samples</span>
          </button>
        )}
      </div>

      {/* Weekly Charts Card */}
      <div className="p-5 rounded-2xl bg-[#0e1117] border border-[#1c2230] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-slate-400">
              Last 7 Days
            </div>
            <div className="text-2xl font-bold text-white font-mono flex items-baseline gap-1.5">
              <span>
                {activeMetric === 'steps'
                  ? weeklyTotalSteps.toLocaleString()
                  : activeMetric === 'calories'
                  ? Math.round(weeklyTotalCalories).toLocaleString()
                  : weeklyTotalMinutes}
              </span>
              <span className="text-xs font-normal text-slate-400 font-sans">
                {currentMetric.unit}
              </span>
            </div>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex p-1 rounded-xl bg-[#151922] border border-[#1c2230] text-xs font-medium self-start sm:self-auto">
            {(['steps', 'calories', 'activeMinutes'] as const).map((m) => {
              const isSelected = activeMetric === m;
              return (
                <button
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  className={`px-3 py-1.5 rounded-lg transition text-xs cursor-pointer ${
                    isSelected
                      ? 'bg-[#0e1117] text-white shadow-sm border border-[#2a3449] font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m === 'activeMinutes' ? 'Minutes' : m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recharts BarChart */}
        <div className="h-44 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2230" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0e1117',
                  borderColor: '#1c2230',
                  borderRadius: '0.5rem',
                  fontSize: '11px',
                  color: '#fff',
                }}
                formatter={(value: any) => [`${value} ${currentMetric.unit}`, currentMetric.label]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return `${label} (${(payload[0].payload as any).fullDate})`;
                  }
                  return label;
                }}
              />
              <Bar dataKey={activeMetric} radius={[4, 4, 0, 0]}>
                {weeklyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === weeklyData.length - 1 ? currentMetric.color : '#1f242e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-slate-400">
          All Sessions ({filteredSessions.length})
        </span>

        <div className="flex gap-1">
          {(['all', 'walking', 'running', 'gym'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                filterType === type
                  ? 'bg-[#151922] text-white border border-[#2a3449]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Sessions List */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-2.5">
          {filteredSessions.map((session) => {
            const distanceFormatted =
              profile.unitSystem === 'imperial'
                ? `${(session.distanceMeters * 0.000621371).toFixed(2)} mi`
                : `${(session.distanceMeters / 1000).toFixed(2)} km`;

            return (
              <div
                key={session.id}
                className="p-4 rounded-xl bg-[#0e1117] border border-[#1c2230] hover:border-[#2a3449] transition space-y-2"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#151922] border border-[#1c2230] flex items-center justify-center text-slate-200">
                      {session.activityType === 'running' ? (
                        <Activity className="w-4 h-4" />
                      ) : session.activityType === 'gym' ? (
                        <Dumbbell className="w-4 h-4" />
                      ) : (
                        <Footprints className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white capitalize">
                        {session.activityType} Workout
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(session.startTime).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at{' '}
                          {new Date(session.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteSession(session.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-[#151922] transition cursor-pointer"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Clean inline metrics with typographic separators */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-300 font-mono pt-1 border-t border-[#1c2230]">
                  <span>{formatDuration(session.durationSeconds)}</span>
                  <span className="text-slate-600">·</span>
                  <span>{session.steps.toLocaleString()} steps</span>
                  <span className="text-slate-600">·</span>
                  <span>{distanceFormatted}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-amber-400 font-bold">{session.calories} kcal</span>
                  {session.avgBpm && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-rose-400 flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                        <span>{session.avgBpm} bpm</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Optional Note */}
                {session.note && (
                  <p className="text-xs text-slate-400 italic bg-[#07090e] p-2 rounded-lg border border-[#1c2230]">
                    "{session.note}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-[#0e1117] border border-dashed border-[#1c2230] text-center space-y-3">
          <BarChart2 className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">No workout records found</div>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Complete a workout on the Workout tab or load sample workouts to explore your weekly charts.
          </p>
          <button
            onClick={onLoadSamples}
            className="px-4 py-2 rounded-lg bg-[#151922] hover:bg-[#1c2230] text-emerald-400 border border-[#1c2230] text-xs font-semibold transition inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Sample Workout History</span>
          </button>
        </div>
      )}

      {/* Clear All Footer */}
      {sessions.length > 0 && (
        <div className="pt-2 text-center">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all workout history?')) {
                onClearAll();
              }
            }}
            className="text-xs text-slate-500 hover:text-rose-400 transition cursor-pointer"
          >
            Clear All Workout Records
          </button>
        </div>
      )}
    </div>
  );
};
