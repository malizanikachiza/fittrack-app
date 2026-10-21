import {
  AlertCircle,
  Bluetooth,
  Camera,
  Flashlight,
  Heart,
  HelpCircle,
  Play,
  Square,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { BluetoothHeartRateState } from '../hooks/useBluetoothHeartRate';
import { CameraPPGState } from '../hooks/useCameraPPG';
import { getCurrentZone, getHeartRateZones } from '../utils/formulas';

interface HeartRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  age: number;
  bluetoothState: BluetoothHeartRateState;
  cameraPPGState: CameraPPGState;
  selectedSource: 'none' | 'bluetooth' | 'camera';
  setSelectedSource: (source: 'none' | 'bluetooth' | 'camera') => void;
}

export const HeartRateModal: React.FC<HeartRateModalProps> = ({
  isOpen,
  onClose,
  age,
  bluetoothState,
  cameraPPGState,
  selectedSource,
  setSelectedSource,
}) => {
  const [activeTab, setActiveTab] = useState<'bluetooth' | 'camera'>('bluetooth');

  if (!isOpen) return null;

  const currentBpm =
    selectedSource === 'bluetooth'
      ? bluetoothState.currentBpm
      : selectedSource === 'camera'
      ? cameraPPGState.currentBpm
      : null;

  const currentZone = currentBpm ? getCurrentZone(currentBpm, age) : null;
  const zones = getHeartRateZones(age);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#0f172a] border border-slate-800 text-slate-100 shadow-2xl p-5 pb-8 sm:pb-6 relative flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Heart Rate Sensors</h2>
              <p className="text-xs text-slate-400">Pair Bluetooth strap or scan via Camera PPG</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('bluetooth')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'bluetooth'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bluetooth className="w-4 h-4 text-cyan-400" />
            <span>Bluetooth LE</span>
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Camera PPG</span>
          </button>
        </div>

        {/* Tab 1: Bluetooth */}
        {activeTab === 'bluetooth' && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Connection</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1.5 ${
                    bluetoothState.isConnected
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      bluetoothState.isConnected ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  {bluetoothState.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {bluetoothState.isConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-850 p-3 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-[11px] text-slate-400">Device</div>
                      <div className="text-sm font-semibold text-white">
                        {bluetoothState.deviceName || 'Heart Rate Monitor'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Current Reading</div>
                      <div className="text-xl font-bold text-rose-400 flex items-center gap-1 justify-end font-mono">
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
                        <span>{bluetoothState.currentBpm || '--'}</span>
                        <span className="text-[10px] text-slate-400 font-sans">BPM</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={bluetoothState.disconnect}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs border border-slate-700 transition cursor-pointer"
                    >
                      Disconnect
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSource('bluetooth');
                        onClose();
                      }}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md shadow-emerald-500/15"
                    >
                      Use in Workout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Connect any standard BLE chest strap, armband, or watch supporting the
                    standard Web Bluetooth Heart Rate Service (0x180D).
                  </p>

                  <button
                    onClick={bluetoothState.connect}
                    disabled={bluetoothState.isConnecting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/15"
                  >
                    <Bluetooth className="w-4 h-4" />
                    <span>
                      {bluetoothState.isConnecting ? 'Searching Devices...' : 'Pair Bluetooth Device'}
                    </span>
                  </button>

                  {/* Browser support note or simulation */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Testing on desktop?</span>
                    <button
                      onClick={() => {
                        if (bluetoothState.isSimulating) {
                          bluetoothState.stopSimulation();
                          setSelectedSource('none');
                        } else {
                          bluetoothState.startSimulation();
                          setSelectedSource('bluetooth');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-medium border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{bluetoothState.isSimulating ? 'Stop Simulator' : 'Simulate BLE (138 BPM)'}</span>
                    </button>
                  </div>
                </div>
              )}

              {bluetoothState.error && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{bluetoothState.error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Camera PPG */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-white">Photoplethysmography (PPG)</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cover the rear camera lens & flash gently with your fingertip. Capillary blood flow
                  pulse modulates red channel light absorption.
                </p>
              </div>

              {/* Live PPG Sensor Waveform Visualizer */}
              <div className="relative w-full h-40 rounded-xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
                {cameraPPGState.isActive || cameraPPGState.isSimulating ? (
                  <div className="w-full h-full p-3 flex flex-col justify-between">
                    {/* Top status bar */}
                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-800">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cameraPPGState.isFingerDetected
                              ? 'bg-emerald-400 animate-pulse'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span className="text-white">
                          {cameraPPGState.isFingerDetected ? 'Capillary Pulse Detected' : 'Place Fingertip on Camera & Flash'}
                        </span>
                      </div>

                      {cameraPPGState.torchActive && (
                        <div className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                          <Flashlight className="w-3 h-3" />
                          <span>Flash ON</span>
                        </div>
                      )}
                    </div>

                    {/* Oscilloscope Waveform SVG */}
                    <div className="flex-1 w-full flex items-center justify-center my-1">
                      {cameraPPGState.pulseWaveform.length > 2 ? (
                        <svg className="w-full h-20" viewBox="0 0 100 50" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={cameraPPGState.pulseWaveform
                              .map((val, idx) => {
                                const x = (idx / (cameraPPGState.pulseWaveform.length - 1)) * 100;
                                const y = 25 - val * 20;
                                return `${x},${y}`;
                              })
                              .join(' ')}
                          />
                        </svg>
                      ) : (
                        <div className="text-slate-500 text-xs">Sampling blood pulse...</div>
                      )}
                    </div>

                    {/* Bottom Live Reading */}
                    <div className="flex items-center justify-between z-10">
                      <div className="text-[10px] text-slate-400 font-mono">
                        Signal: {cameraPPGState.signalQuality}%
                      </div>
                      <div className="bg-black/80 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
                        <span className="text-base font-bold text-rose-400 font-mono">
                          {cameraPPGState.currentBpm || '--'}
                        </span>
                        <span className="text-[10px] text-slate-400">BPM</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-xs gap-1.5 p-4 text-center">
                    <Camera className="w-6 h-6 text-slate-600" />
                    <span>Camera scanner is idle. Tap "Start Camera Scanner" below.</span>
                  </div>
                )}
              </div>

              {/* Camera Scanner Controls */}
              <div className="space-y-2">
                {!cameraPPGState.isActive ? (
                  <button
                    onClick={cameraPPGState.startScanner}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-emerald-500/15"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Start Camera Scanner</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={cameraPPGState.stopScanner}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Stop Scanner</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSource('camera');
                        onClose();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md shadow-emerald-500/15"
                    >
                      Use in Workout
                    </button>
                  </div>
                )}

                {/* Simulation toggle */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Desktop / no camera flash?</span>
                  <button
                    onClick={() => {
                      if (cameraPPGState.isSimulating) {
                        cameraPPGState.stopSimulation();
                        setSelectedSource('none');
                      } else {
                        cameraPPGState.startSimulation();
                        setSelectedSource('camera');
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-medium border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>{cameraPPGState.isSimulating ? 'Stop Simulator' : 'Simulate PPG (125 BPM)'}</span>
                  </button>
                </div>
              </div>

              {cameraPPGState.error && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cameraPPGState.error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Heart Rate Zones Reference */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-300 block">
            Target Heart Rate Zones (Age {age}):
          </span>
          <div className="space-y-1">
            {zones.map((zone) => (
              <div
                key={zone.zone}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: zone.color }}
                  />
                  <span className="font-medium text-slate-200">
                    Zone {zone.zone} · {zone.name}
                  </span>
                </div>
                <span className="font-mono text-slate-400">
                  {zone.minBpm} – {zone.maxBpm} BPM
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs border border-slate-700 transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
