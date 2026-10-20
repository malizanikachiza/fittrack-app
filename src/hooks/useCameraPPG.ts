import { useCallback, useEffect, useRef, useState } from 'react';

export interface CameraPPGState {
  isSupported: boolean;
  isActive: boolean;
  isFingerDetected: boolean;
  torchActive: boolean;
  currentBpm: number | null;
  signalQuality: number; // 0 - 100%
  error: string | null;
  pulseWaveform: number[]; // rolling normalized values -1 to 1 for live chart
  startScanner: () => Promise<boolean>;
  stopScanner: () => void;
  toggleTorch: () => Promise<void>;
  isSimulating: boolean;
  startSimulation: () => void;
  stopSimulation: () => void;
}

export function useCameraPPG(): CameraPPGState {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isFingerDetected, setIsFingerDetected] = useState<boolean>(false);
  const [torchActive, setTorchActive] = useState<boolean>(false);
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [signalQuality, setSignalQuality] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [pulseWaveform, setPulseWaveform] = useState<number[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // PPG signal processing state stored in refs
  const redHistoryRef = useRef<{ time: number; val: number }[]>([]);
  const rawWaveformRef = useRef<number[]>([]);
  const peakTimestampsRef = useRef<number[]>([]);
  const lowPassRef = useRef<number>(128);
  const highPassBaselineRef = useRef<number>(128);
  const lastPeakTimeRef = useRef<number>(0);
  const isRisingRef = useRef<boolean>(false);
  const prevValRef = useRef<number>(0);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  const stopScanner = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setTorchActive(false);
    setIsFingerDetected(false);
    setSignalQuality(0);
    setCurrentBpm(null);
    setPulseWaveform([]);
    redHistoryRef.current = [];
    rawWaveformRef.current = [];
    peakTimestampsRef.current = [];
  }, []);

  // Frame processing loop
  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && ctx) {
      const width = canvas.width;
      const height = canvas.height;

      // Draw center region to canvas
      ctx.drawImage(video, 0, 0, width, height);
      const frame = ctx.getImageData(0, 0, width, height);
      const data = frame.data;

      let totalRed = 0;
      let totalGreen = 0;
      let totalBlue = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        totalRed += data[i];
        totalGreen += data[i + 1];
        totalBlue += data[i + 2];
      }

      const avgRed = totalRed / pixelCount;
      const avgGreen = totalGreen / pixelCount;
      const avgBlue = totalBlue / pixelCount;

      // Finger presence validation:
      // High red dominance indicates illuminated capillary blood
      const redRatio = avgRed / (avgGreen + avgBlue + 1);
      const fingerCovering = avgRed > 55 && redRatio > 0.95;

      setIsFingerDetected(fingerCovering);

      const now = performance.now();

      if (fingerCovering) {
        // Bandpass filtering (0.75 Hz to 3.5 Hz)
        // 1. Low pass filter (alpha = 0.25) to remove high-frequency camera noise
        const lpAlpha = 0.25;
        const lowPassed = lpAlpha * avgRed + (1 - lpAlpha) * lowPassRef.current;
        lowPassRef.current = lowPassed;

        // 2. High pass baseline filter (beta = 0.02) to track slow baseline drift
        const hpBeta = 0.02;
        const baseline = hpBeta * lowPassed + (1 - hpBeta) * highPassBaselineRef.current;
        highPassBaselineRef.current = baseline;

        // AC Component (pulsatile PPG wave)
        const acSignal = lowPassed - baseline;

        // Store rolling waveform samples for rendering
        const waveform = rawWaveformRef.current;
        waveform.push(acSignal);
        if (waveform.length > 50) waveform.shift();

        // Normalize between -1 and 1
        const maxVal = Math.max(...waveform.map(Math.abs), 0.5);
        const normalized = waveform.map((v) => Math.max(-1, Math.min(1, v / maxVal)));
        setPulseWaveform([...normalized]);

        // Peak detection algorithm:
        // Refractory period: minimum 320ms between beats (max 187 BPM)
        const timeSinceLastPeak = now - lastPeakTimeRef.current;
        const prev = prevValRef.current;

        if (acSignal > prev) {
          isRisingRef.current = true;
        } else if (isRisingRef.current && acSignal < prev) {
          // Detected local peak
          if (prev > 0.15 && timeSinceLastPeak >= 320 && timeSinceLastPeak <= 1800) {
            lastPeakTimeRef.current = now;
            const peaks = peakTimestampsRef.current;
            peaks.push(now);

            // Keep peaks within last 8 seconds
            const cutoff = now - 8000;
            while (peaks.length > 0 && peaks[0] < cutoff) {
              peaks.shift();
            }

            if (peaks.length >= 3) {
              // Calculate intervals
              const intervals: number[] = [];
              for (let i = 1; i < peaks.length; i++) {
                intervals.push(peaks[i] - peaks[i - 1]);
              }
              // Average interval
              const avgIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
              if (avgIntervalMs > 0) {
                const calculatedBpm = Math.round((60000 / avgIntervalMs));
                if (calculatedBpm >= 45 && calculatedBpm <= 200) {
                  setCurrentBpm(calculatedBpm);
                  setSignalQuality(Math.min(98, 70 + peaks.length * 4));
                }
              }
            }
          }
          isRisingRef.current = false;
        }
        prevValRef.current = acSignal;
      } else {
        // Finger not steady
        setSignalQuality(10);
        setPulseWaveform((prev) => (prev.length > 0 ? prev.map((v) => v * 0.9) : []));
      }
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, []);

  const startScanner = useCallback(async (): Promise<boolean> => {
    setError(null);
    stopScanner();

    if (!isSupported) {
      setError('Camera access is not supported in this browser environment.');
      return false;
    }

    try {
      // Create hidden video element if not present
      if (!videoRef.current) {
        const vid = document.createElement('video');
        vid.setAttribute('playsinline', 'true');
        vid.setAttribute('autoplay', 'true');
        vid.muted = true;
        videoRef.current = vid;
      }

      if (!canvasRef.current) {
        const can = document.createElement('canvas');
        can.width = 64;
        can.height = 64;
        canvasRef.current = can;
      }

      // Request rear camera (environment) with optimal size for fast frame sampling
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 30 },
        },
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // Attempt to turn on camera torch/flash
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities?.() as unknown as { torch?: boolean };
        if (capabilities && capabilities.torch) {
          try {
            await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
              advanced: [{ torch: true }],
            });
            setTorchActive(true);
          } catch (torchErr) {
            console.warn('Torch activation not permitted:', torchErr);
          }
        }
      }

      setIsActive(true);
      animFrameRef.current = requestAnimationFrame(processFrame);
      return true;
    } catch (err: unknown) {
      console.warn('Camera PPG start error:', err);
      const msg = err instanceof Error ? err.message : 'Unable to access camera. Please allow camera permissions.';
      setError(msg);
      stopScanner();
      return false;
    }
  }, [isSupported, processFrame, stopScanner]);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchActive;
        await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchActive(nextState);
      } catch (err) {
        console.warn('Toggle torch failed:', err);
      }
    }
  }, [torchActive]);

  // Simulation mode for testing PPG on devices without camera or flash
  const startSimulation = useCallback(() => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setIsSimulating(true);
    setIsActive(true);
    setIsFingerDetected(true);
    setSignalQuality(95);

    let phase = 0;
    let baseBpm = 125;
    setCurrentBpm(baseBpm);

    simTimerRef.current = setInterval(() => {
      phase += 0.25;
      // Synthesize pulse wave with systolic and dicrotic notch
      const wave = Math.sin(phase) + 0.35 * Math.sin(2 * phase + 0.5);
      setPulseWaveform((prev) => {
        const next = [...prev, Math.max(-1, Math.min(1, wave))];
        if (next.length > 50) next.shift();
        return next;
      });

      // Subtle BPM fluctuation
      if (Math.random() > 0.7) {
        baseBpm = Math.round(Math.min(170, Math.max(75, baseBpm + (Math.random() - 0.49) * 3)));
        setCurrentBpm(baseBpm);
      }
    }, 60);
  }, []);

  const stopSimulation = useCallback(() => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    setIsSimulating(false);
    setIsActive(false);
    setIsFingerDetected(false);
    setCurrentBpm(null);
    setPulseWaveform([]);
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [stopScanner]);

  return {
    isSupported,
    isActive,
    isFingerDetected,
    torchActive,
    currentBpm,
    signalQuality,
    error,
    pulseWaveform,
    startScanner,
    stopScanner,
    toggleTorch,
    isSimulating,
    startSimulation,
    stopSimulation,
  };
}
