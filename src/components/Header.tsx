import { Activity, Eye } from 'lucide-react';
import React from 'react';
import { InstallPrompt } from './InstallPrompt';

interface HeaderProps {
  isWorkoutActive: boolean;
  isWakeLocked: boolean;
  onOpenWorkoutTab: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isWorkoutActive,
  isWakeLocked,
  onOpenWorkoutTab,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#07090e]/90 backdrop-blur-md border-b border-[#1c2230] px-4 py-3">
      <div className="max-w-md lg:max-w-2xl mx-auto flex items-center justify-between">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-extrabold tracking-tight text-white text-base">FitTrack</span>
        </div>

        {/* Right Status Affordances */}
        <div className="flex items-center gap-3">
          {/* Active Workout indicator */}
          {isWorkoutActive && (
            <button
              onClick={onOpenWorkoutTab}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Session Active</span>
            </button>
          )}

          {/* Screen Wake Lock subtle indicator */}
          {isWakeLocked && (
            <span
              className="flex items-center gap-1 text-[11px] text-slate-400"
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
