/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { HeartRateModal } from './components/HeartRateModal';
import { HistoryTab } from './components/HistoryTab';
import { Navigation, TabType } from './components/Navigation';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProfileTab } from './components/ProfileTab';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { TodayTab } from './components/TodayTab';
import { WorkoutTab } from './components/WorkoutTab';
import { useActivityRecognition } from './hooks/useActivityRecognition';
import { useBluetoothHeartRate } from './hooks/useBluetoothHeartRate';
import { useCalorieBurn } from './hooks/useCalorieBurn';
import { useCameraPPG } from './hooks/useCameraPPG';
import { useDeviceMotion } from './hooks/useDeviceMotion';
import { useUserProfile } from './hooks/useUserProfile';
import { useWakeLock } from './hooks/useWakeLock';
import { useWorkoutHistory } from './hooks/useWorkoutHistory';
import { WorkoutSession } from './types/fitness';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [isWorkoutActive, setIsWorkoutActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<number>(0);

  const [hrSource, setHrSource] = useState<'none' | 'bluetooth' | 'camera'>('none');
  const [isHrModalOpen, setIsHrModalOpen] = useState<boolean>(false);
  const [finishedSession, setFinishedSession] = useState<WorkoutSession | null>(null);

  // Persistent user profile
  const { profile, updateProfile, resetProfile } = useUserProfile();

  // Hardware and Sensor Hooks
  const bluetoothState = useBluetoothHeartRate();
  const cameraPPGState = useCameraPPG();

  // Determine active BPM based on selected heart rate source
  const activeBpm =
    hrSource === 'bluetooth'
      ? bluetoothState.currentBpm
      : hrSource === 'camera'
      ? cameraPPGState.currentBpm
      : null;

  // Auto-connect source detection: if bluetooth connects, set source to bluetooth
  useEffect(() => {
    if (bluetoothState.isConnected) {
      setHrSource('bluetooth');
    } else if (hrSource === 'bluetooth' && !bluetoothState.isConnected) {
      setHrSource('none');
    }
  }, [bluetoothState.isConnected, hrSource]);

  // If camera scanner becomes active, set source to camera
  useEffect(() => {
    if (cameraPPGState.isActive) {
      setHrSource('camera');
    } else if (hrSource === 'camera' && !cameraPPGState.isActive) {
      setHrSource('none');
    }
  }, [cameraPPGState.isActive, hrSource]);

  // Step detection with DeviceMotion API
  const motionState = useDeviceMotion(
    profile.heightCm,
    'walking', // default, activity hook will guide cadence/variance
    isWorkoutActive && !isPaused
  );

  // Activity classification (Walking / Running / Gym) with manual override
  const activityState = useActivityRecognition(
    motionState.cadence,
    motionState.magnitudeVariance,
    isWorkoutActive
  );

  // Calorie accumulation (MET vs Keytel Heart Rate Formula)
  const calorieState = useCalorieBurn(
    isWorkoutActive && !isPaused,
    activityState.currentActivity,
    motionState.cadence,
    activeBpm,
    profile.weightKg,
    profile.age,
    profile.sex
  );

  // Screen Wake Lock API: keeps screen on during active workouts
  const { isLocked: isWakeLocked } = useWakeLock(isWorkoutActive && !isPaused);

  // Workout History storage & weekly aggregation
  const {
    sessions,
    addSession,
    deleteSession,
    clearAllSessions,
    loadSampleSessions,
    getWeeklyData,
  } = useWorkoutHistory();

  // Heart rate samples for the active session
  const [workoutHrSamples, setWorkoutHrSamples] = useState<{ timestamp: number; bpm: number }[]>([]);
  const [rollingHrData, setRollingHrData] = useState<{ time: string; bpm: number }[]>([]);

  // Workout timer loop
  useEffect(() => {
    if (!isWorkoutActive || isPaused) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isWorkoutActive, isPaused]);

  // Rolling HR data collection
  useEffect(() => {
    if (!isWorkoutActive || isPaused || !activeBpm) return;

    const interval = setInterval(() => {
      if (activeBpm && activeBpm > 40) {
        const timeStr = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
        setRollingHrData((prev) => {
          const next = [...prev, { time: timeStr, bpm: activeBpm }];
          if (next.length > 30) next.shift();
          return next;
        });

        setWorkoutHrSamples((prev) => [
          ...prev,
          { timestamp: Date.now(), bpm: activeBpm },
        ]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorkoutActive, isPaused, activeBpm]);

  // Controls
  const handleStartWorkout = async () => {
    // Request iOS motion permission if needed
    if (motionState.permissionState === 'prompt') {
      await motionState.requestPermission();
    }

    motionState.resetSteps();
    calorieState.resetCalories();
    setElapsedSeconds(0);
    setWorkoutStartTime(Date.now());
    setWorkoutHrSamples([]);
    setRollingHrData([]);
    setIsPaused(false);
    setIsWorkoutActive(true);
    setActiveTab('workout');
  };

  const handlePauseWorkout = () => {
    setIsPaused(true);
  };

  const handleResumeWorkout = () => {
    setIsPaused(false);
  };

  const handleStopWorkout = () => {
    const duration = Math.max(1, elapsedSeconds);
    const validSamples = workoutHrSamples.filter((s) => s.bpm >= 45);

    let avgBpm: number | null = null;
    let maxBpm: number | null = null;

    if (validSamples.length > 0) {
      avgBpm = Math.round(
        validSamples.reduce((acc, s) => acc + s.bpm, 0) / validSamples.length
      );
      maxBpm = Math.max(...validSamples.map((s) => s.bpm));
    }

    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      startTime: workoutStartTime || Date.now() - duration * 1000,
      endTime: Date.now(),
      durationSeconds: duration,
      activityType: activityState.currentActivity,
      steps: motionState.steps,
      cadence: motionState.cadence,
      distanceMeters: motionState.distanceMeters,
      calories: Math.round(calorieState.totalCalories),
      calorieCalculationMethod: calorieState.activeMethod,
      avgBpm,
      maxBpm,
      heartRateSamples: validSamples,
    };

    setIsWorkoutActive(false);
    setIsPaused(false);
    setFinishedSession(session);
  };

  const handleSaveFinishedSession = (session: WorkoutSession) => {
    addSession(session);
    setFinishedSession(null);
    setActiveTab('today');
  };

  const handleDiscardFinishedSession = () => {
    setFinishedSession(null);
  };

  // Filter today's completed sessions
  const todaySessions = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    return sessions.filter((s) => s.startTime >= todayMs);
  }, [sessions]);

  // Weekly data including live tracking
  const weeklyData = getWeeklyData(
    isWorkoutActive ? motionState.steps : 0,
    isWorkoutActive ? calorieState.totalCalories : 0
  );

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Offline Alert */}
      <OfflineIndicator />

      {/* Top Header */}
      <Header
        isWorkoutActive={isWorkoutActive}
        isWakeLocked={isWakeLocked}
        onOpenWorkoutTab={() => setActiveTab('workout')}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-md lg:max-w-xl w-full mx-auto px-4 pt-4">
        {activeTab === 'today' && (
          <TodayTab
            profile={profile}
            liveSteps={isWorkoutActive ? motionState.steps : 0}
            liveCalories={isWorkoutActive ? calorieState.totalCalories : 0}
            liveDurationSeconds={isWorkoutActive ? elapsedSeconds : 0}
            liveDistanceMeters={isWorkoutActive ? motionState.distanceMeters : 0}
            isWorkoutActive={isWorkoutActive}
            todaySessions={todaySessions}
            onStartWorkout={handleStartWorkout}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'workout' && (
          <WorkoutTab
            isWorkoutActive={isWorkoutActive}
            isPaused={isPaused}
            elapsedSeconds={elapsedSeconds}
            onStart={handleStartWorkout}
            onPause={handlePauseWorkout}
            onResume={handleResumeWorkout}
            onStop={handleStopWorkout}
            profile={profile}
            motionState={motionState}
            activityState={activityState}
            bluetoothState={bluetoothState}
            cameraPPGState={cameraPPGState}
            calorieState={calorieState}
            hrSource={hrSource}
            onOpenHeartRateModal={() => setIsHrModalOpen(true)}
            rollingHrData={rollingHrData}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            sessions={sessions}
            weeklyData={weeklyData}
            profile={profile}
            onDeleteSession={deleteSession}
            onClearAll={clearAllSessions}
            onLoadSamples={loadSampleSessions}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            profile={profile}
            onUpdateProfile={updateProfile}
            onResetProfile={resetProfile}
          />
        )}
      </main>

      {/* Heart Rate Modal (BLE and PPG) */}
      <HeartRateModal
        isOpen={isHrModalOpen}
        onClose={() => setIsHrModalOpen(false)}
        age={profile.age}
        bluetoothState={bluetoothState}
        cameraPPGState={cameraPPGState}
        selectedSource={hrSource}
        setSelectedSource={setHrSource}
      />

      {/* Post-Workout Summary Dialog */}
      <SessionSummaryModal
        session={finishedSession}
        age={profile.age}
        unitSystem={profile.unitSystem}
        onSave={handleSaveFinishedSession}
        onDiscard={handleDiscardFinishedSession}
      />

      {/* Bottom Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isWorkoutActive={isWorkoutActive}
      />
    </div>
  );
}
