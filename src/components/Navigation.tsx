import { Activity, BarChart2, Flame, User } from 'lucide-react';
import React from 'react';

export type TabType = 'today' | 'workout' | 'history' | 'profile';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isWorkoutActive: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  isWorkoutActive,
}) => {
  const tabs = [
    { id: 'today' as TabType, label: 'Today', icon: Flame },
    { id: 'workout' as TabType, label: 'Workout', icon: Activity },
    { id: 'history' as TabType, label: 'History', icon: BarChart2 },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#07090e]/95 backdrop-blur-xl border-t border-[#1c2230] px-4 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl">
      <div className="max-w-md lg:max-w-2xl mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isWorkoutTab = tab.id === 'workout';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-4 rounded-xl transition-colors duration-150 select-none min-w-[68px] min-h-[48px] cursor-pointer ${
                isActive
                  ? 'text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'
                  }`}
                />

                {/* Workout in-progress live indicator */}
                {isWorkoutTab && isWorkoutActive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] mt-1 tracking-tight ${
                  isActive ? 'font-semibold text-white' : 'font-medium text-slate-400'
                }`}
              >
                {tab.label}
              </span>

              {/* Minimal active bottom tick */}
              {isActive && (
                <span className="absolute bottom-0.5 w-4 h-0.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
