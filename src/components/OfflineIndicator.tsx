import { WifiOff } from 'lucide-react';
import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg bg-[#151922] backdrop-blur-md px-3 py-1.5 text-xs font-medium text-slate-200 shadow-xl border border-[#1c2230]">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Offline Mode · Data stored locally</span>
    </div>
  );
};
