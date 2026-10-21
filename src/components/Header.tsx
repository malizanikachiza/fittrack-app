import { Activity, CheckCircle2, CloudOff, Eye, RefreshCw } from 'lucide-react';
import React from 'react';
import { useAuthSync } from '../context/AuthSyncContext';
import { InstallPrompt } from './InstallPrompt';

interface HeaderProps {
  isWorkoutActive: boolean;
  isWakeLocked: boolean;
  onOpenWorkoutTab: () => void;
  onOpenProfileTab?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isWorkoutActive,
  isWakeLocked,
  onOpenWorkoutTab,
  onOpenProfileTab,
}) => {
  const { user, syncStatus } = useAuthSync();

  return (
    <header className="sticky top-0 z-30 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-md lg:max-w-xl mx-auto flex items-center justify-between">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
            <Activity className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-extrabold tracking-tight text-white text-base">FitTrack</span>
        </div>

        {/* Right Status Affordances */}
        <div className="flex items-center gap-2">
          {/* Sync status indicator */}
          {user && (
            <button
              onClick={onOpenProfileTab}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium transition cursor-pointer hover:border-slate-700"
              title={`Cloud Firestore sync: ${syncStatus}`}
            >
              {syncStatus === 'Synced' && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold hidden sm:inline">Synced</span>
                </>
              )}
              {syncStatus === 'Offline' && (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-semibold hidden sm:inline">Offline</span>
                </>
              )}
              {syncStatus === 'Syncing' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span className="text-cyan-400 font-semibold hidden sm:inline">Syncing</span>
                </>
              )}
            </button>
          )}

          {/* Active Workout indicator */}
          {isWorkoutActive && (
            <button
              onClick={onOpenWorkoutTab}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition cursor-pointer shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Session Active</span>
            </button>
          )}

          {/* Screen Wake Lock subtle indicator */}
          {isWakeLocked && (
            <span
              className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800"
              title="Screen Wake Lock is active"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Screen On</span>
            </span>
          )}

          {/* PWA Install Button */}
          <InstallPrompt />
        </div>
      </div>
    </header>
  );
};
