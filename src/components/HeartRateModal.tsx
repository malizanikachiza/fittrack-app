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
      <div className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#0e1117] border border-[#1c2230] text-slate-100 shadow-2xl p-5 pb-8 sm:pb-6 relative flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1c2230] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Heart Rate Sensors</h2>
              <p className="text-xs text-slate-400">Pair Bluetooth strap or scan via Camera</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#151922] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#07090e] border border-[#1c2230] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('bluetooth')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'bluetooth'
                ? 'bg-[#151922] text-white shadow-sm border border-[#2a3449]'
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
                ? 'bg-[#151922] text-white shadow-sm border border-[#2a3449]'
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
            <div className="p-4 rounded-xl bg-[#07090e] border border-[#1c2230] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Connection</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 ${
                    bluetoothState.isConnected
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                      : 'bg-[#151922] text-slate-400 border border-[#1c2230]'
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
                  <div className="flex items-center justify-between bg-[#151922] p-3 rounded-lg border border-[#1c2230]">
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
                      onClick={() => {
                        bluetoothState.disconnect();
                        setSelectedSource('none');
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#151922] hover:bg-[#1c2230] border border-[#1c2230] text-slate-300 font-semibold text-xs transition cursor-pointer"
                    >
                      Disconnect
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSource('bluetooth');
                        onClose();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      Use in Workout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Connects to any standard BLE chest strap or smartwatch using the standard{' '}
                    <strong>0x180D Heart Rate Service</strong> (Polar, Garmin, Wahoo, Apple).
                  </p>

                  <button
                    disabled={bluetoothState.isConnecting}
                    onClick={async () => {
                      const success = await bluetoothState.connect();
                      if (success) {
                        setSelectedSource('bluetooth');
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <Bluetooth className="w-4 h-4" />
                    <span>{bluetoothState.isConnecting ? 'Searching...' : 'Scan & Pair Bluetooth Device'}</span>
                  </button>

                  {/* Fallback Simulation Button */}
                  <div className="pt-2 border-t border-[#1c2230] flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Desktop test mode</span>
                    <button
                      onClick={() => {
                        if (bluetoothState.isSimulating) {
                          bluetoothState.stopSimulation();
                          setSelectedSource('none');
                        } else {
                          bluetoothState.startSimulation(138);
                          setSelectedSource('bluetooth');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#151922] hover:bg-[#1c2230] text-slate-300 text-[11px] font-medium border border-[#1c2230] transition flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{bluetoothState.isSimulating ? 'Stop Simulator' : 'Simulate BLE (138 BPM)'}</span>
                    </button>
                  </div>
                </div>
              )}

              {bluetoothState.error && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
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
            <div className="p-4 rounded-xl bg-[#07090e] border border-[#1c2230] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Scanner</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 ${
                    cameraPPGState.isActive
                      ? cameraPPGState.isFingerDetected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                      : 'bg-[#151922] text-slate-400 border border-[#1c2230]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      cameraPPGState.isActive
                        ? cameraPPGState.isFingerDetected
                          ? 'bg-emerald-400'
                          : 'bg-amber-400'
                        : 'bg-slate-500'
                    }`}
                  />
                  {cameraPPGState.isActive
                    ? cameraPPGState.isFingerDetected
                      ? 'Reading Pulse'
                      : 'Cover Camera & Flash'
                    : 'Inactive'}
                </span>
              </div>

              {/* Instructions */}
              <div className="text-xs text-slate-300 flex items-start gap-2 bg-[#151922] p-2.5 rounded-lg border border-[#1c2230]">
                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Gently press your index finger over the <strong>rear camera lens and flash</strong>. Hold steady for 5–10 seconds.
                </span>
              </div>

              {/* Waveform Visualizer */}
              {cameraPPGState.isActive && (
                <div className="space-y-2">
                  <div className="h-16 w-full bg-[#151922] rounded-lg border border-[#1c2230] p-2 relative overflow-hidden flex items-center">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                      {cameraPPGState.pulseWaveform.length > 1 && (
                        <path
                          d={cameraPPGState.pulseWaveform.reduce((acc, val, idx, arr) => {
                            const x = (idx / (arr.length - 1)) * 100;
                            const y = 20 - val * 16;
                            return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }, '')}
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    </svg>

                    <div className="absolute bottom-1 right-2 text-[9px] text-slate-500 font-mono">
                      PPG Pulse
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] text-slate-400">Signal Quality:</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1 rounded-full bg-[#1c2230] overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${cameraPPGState.signalQuality}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {cameraPPGState.signalQuality}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* BPM readout */}
              <div className="flex items-center justify-between bg-[#151922] p-3 rounded-lg border border-[#1c2230]">
                <div>
                  <div className="text-[11px] text-slate-400">Calculated BPM</div>
                  <div className="text-xs text-slate-300">Optical PPG</div>
                </div>
                <div className="text-2xl font-bold text-rose-400 flex items-center gap-1.5 font-mono">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
                  <span>{cameraPPGState.currentBpm || '--'}</span>
                  <span className="text-xs text-slate-400 font-sans">BPM</span>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-2">
                {!cameraPPGState.isActive ? (
                  <button
                    onClick={async () => {
                      const success = await cameraPPGState.startScanner();
                      if (success) {
                        setSelectedSource('camera');
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Start Camera Pulse Scanner</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        cameraPPGState.stopScanner();
                        setSelectedSource('none');
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#151922] hover:bg-[#1c2230] border border-[#1c2230] text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-slate-400 text-slate-400" />
                      <span>Stop Scanner</span>
                    </button>
                    <button
                      onClick={cameraPPGState.toggleTorch}
                      className="px-3 py-2.5 rounded-xl bg-[#151922] hover:bg-[#1c2230] text-slate-200 border border-[#1c2230] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Flashlight className="w-3.5 h-3.5" />
                      <span>{cameraPPGState.torchActive ? 'Flash ON' : 'Flash'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSource('camera');
                        onClose();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      Use in Workout
                    </button>
                  </div>
                )}

                {/* Simulation toggle */}
                <div className="pt-2 border-t border-[#1c2230] flex items-center justify-between">
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
                    className="px-2.5 py-1 rounded-lg bg-[#151922] hover:bg-[#1c2230] text-slate-300 text-[11px] font-medium border border-[#1c2230] transition flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>{cameraPPGState.isSimulating ? 'Stop Simulator' : 'Simulate PPG (125 BPM)'}</span>
                  </button>
                </div>
              </div>

              {cameraPPGState.error && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cameraPPGState.error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Heart Rate Zones Reference */}
        <div className="space-y-1.5 pt-1 border-t border-[#1c2230]">
          <span className="text-xs font-semibold text-slate-300 block">
            Target Heart Rate Zones (Age {age}):
          </span>
          <div className="space-y-1">
            {zones.map((zone) => (
              <div
                key={zone.zone}
                className="flex items-center justify-between p-2 rounded-lg bg-[#07090e] text-xs"
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
          className="w-full py-2.5 rounded-xl bg-[#151922] hover:bg-[#1c2230] text-white font-semibold text-xs border border-[#1c2230] transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
