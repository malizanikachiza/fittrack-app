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
  MapPin,
  Navigation,
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
import { ActivityType, UserProfile, WeeklyDayData, WorkoutSession } from '../types/fitness';
import { formatDuration } from '../utils/formulas';
import { WorkoutMap } from './WorkoutMap';

interface HistoryTabProps {
  sessions: WorkoutSession[];
  weeklyData: WeeklyDayData[];
  profile: UserProfile;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onLoadSamples: () => void;
}

type MetricType = 'steps' | 'calories' | 'activeMinutes';

export const HistoryTab: React.FC<HistoryTabProps> = ({
  sessions,
  weeklyData,
  profile,
  onDeleteSession,
  onClearAll,
  onLoadSamples,
}) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>('steps');
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);

  const metricConfig: Record<
    MetricType,
    { label: string; unit: string; color: string }
  > = {
    steps: { label: 'Steps', unit: 'steps', color: '#10b981' },
    calories: { label: 'Calories', unit: 'kcal', color: '#f59e0b' },
    activeMinutes: { label: 'Active Time', unit: 'min', color: '#0ea5e9' },
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
          <h1 className="text-xl font-extrabold text-white tracking-tight">Workout History</h1>
          <p className="text-xs text-slate-400">Weekly progress & logged workouts</p>
        </div>

        {sessions.length === 0 && (
          <button
            onClick={onLoadSamples}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Samples</span>
          </button>
        )}
      </div>

      {/* Weekly Charts Card */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4 shadow-xl">
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
          <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium self-start sm:self-auto">
            {(['steps', 'calories', 'activeMinutes'] as const).map((m) => {
              const isSelected = activeMetric === m;
              return (
                <button
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  className={`px-3 py-1.5 rounded-lg transition text-xs cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700 font-semibold'
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
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
                    fill={index === weeklyData.length - 1 ? currentMetric.color : '#1e293b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter and Sessions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Logged Workouts ({filteredSessions.length})
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'walking', 'running', 'gym'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer capitalize ${
                filterType === t
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-semibold'
                  : 'bg-[#0f172a] text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}

          {sessions.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-2 py-1 text-slate-500 hover:text-rose-400 text-xs transition cursor-pointer ml-1"
              title="Clear all sessions"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Sessions List */}
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
                className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3 shadow-sm hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-200">
                      {session.activityType === 'running' ? (
                        <Activity className="w-5 h-5 text-emerald-400" />
                      ) : session.activityType === 'gym' ? (
                        <Dumbbell className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Footprints className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white capitalize">
                        {session.activityType} Workout
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>
                          {new Date(session.startTime).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-slate-600">·</span>
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>
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
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Clean inline metrics with typographic separators */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-300 font-mono pt-1 border-t border-slate-800">
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
                  <p className="text-xs text-slate-400 italic bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    "{session.note}"
                  </p>
                )}

                {/* Traced Route Map Expander */}
                {session.routePath && session.routePath.length > 1 && (
                  <div className="pt-1">
                    <button
                      onClick={() => setExpandedMapId(expandedMapId === session.id ? null : session.id)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-medium transition cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{expandedMapId === session.id ? 'Hide Traced Map' : 'View Traced Map'}</span>
                    </button>
                    {expandedMapId === session.id && (
                      <div className="mt-2 rounded-2xl overflow-hidden border border-slate-800">
                        <WorkoutMap
                          currentLocation={session.routePath[session.routePath.length - 1]}
                          routePath={session.routePath}
                          accuracy={null}
                          speed={null}
                          isTracking={false}
                          isSimulating={false}
                          onStartSimulation={() => {}}
                          onStopSimulation={() => {}}
                          className="h-44 sm:h-52"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-[#0f172a] border border-dashed border-slate-800 text-center space-y-3">
          <BarChart2 className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">No workout records found</div>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Complete a workout or tap "Load Samples" above to view charts and statistics.
          </p>
        </div>
      )}
    </div>
  );
};
