import { Download, HelpCircle, X } from 'lucide-react';
import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const InstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable && (
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 hover:border-emerald-500/40 font-semibold text-xs transition shadow-sm cursor-pointer"
          title="Install FitTrack PWA on your device"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
      )}

      {isIOS && !isInstallable && (
        <button
          onClick={() => setShowIOSModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition cursor-pointer"
          title="Install on iOS"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Add to iOS</span>
        </button>
      )}

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f172a] border border-slate-800 p-6 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Install on iPhone / iPad</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              To install FitTrack with full-screen view and offline tracking:
            </p>
            <ol className="space-y-2.5 text-xs text-slate-300 mb-5 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-4 h-4 rounded bg-slate-800 text-emerald-400 font-bold flex items-center justify-center text-[10px]">1</span>
                <span>Tap the <strong>Share button</strong> in Safari toolbar.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-4 h-4 rounded bg-slate-800 text-emerald-400 font-bold flex items-center justify-center text-[10px]">2</span>
                <span>Select <strong>Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-4 h-4 rounded bg-slate-800 text-emerald-400 font-bold flex items-center justify-center text-[10px]">3</span>
                <span>Tap <strong>Add</strong> in the top right.</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md shadow-emerald-500/20"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
