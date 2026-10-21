import { useCallback, useEffect, useRef, useState } from 'react';

export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface LocationTrackerState {
  isSupported: boolean;
  isTracking: boolean;
  currentLocation: { lat: number; lng: number } | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  routePath: LocationPoint[];
  gpsDistanceMeters: number;
  permissionStatus: 'prompt' | 'granted' | 'denied';
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
  resetRoute: () => void;
  isSimulating: boolean;
  startSimulation: () => void;
  stopSimulation: () => void;
}

// Haversine formula to compute distance in meters between two lat/lng coordinates
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Preset running loop for simulation (approx 2.5km loop)
const SIMULATION_POINTS: { lat: number; lng: number }[] = [
  { lat: 40.7829, lng: -73.9654 },
  { lat: 40.7838, lng: -73.9642 },
  { lat: 40.7852, lng: -73.9628 },
  { lat: 40.7869, lng: -73.9615 },
  { lat: 40.7885, lng: -73.9608 },
  { lat: 40.7901, lng: -73.9612 },
  { lat: 40.7915, lng: -73.9625 },
  { lat: 40.7922, lng: -73.9645 },
  { lat: 40.7918, lng: -73.9668 },
  { lat: 40.7905, lng: -73.9688 },
  { lat: 40.7888, lng: -73.9702 },
  { lat: 40.7871, lng: -73.9712 },
  { lat: 40.7854, lng: -73.9710 },
  { lat: 40.7840, lng: -73.9698 },
  { lat: 40.7831, lng: -73.9678 },
  { lat: 40.7829, lng: -73.9654 },
];

export function useLocationTracker(isWorkoutActive: boolean): LocationTrackerState {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [routePath, setRoutePath] = useState<LocationPoint[]>([]);
  const [gpsDistanceMeters, setGpsDistanceMeters] = useState<number>(0);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<{ lat: number; lng: number } | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);
  const simIndexRef = useRef<number>(0);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setIsSupported(true);
      // Query permission status if available
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions
          .query({ name: 'geolocation' as PermissionName })
          .then((status) => {
            setPermissionStatus(status.state as 'prompt' | 'granted' | 'denied');
            status.onchange = () => {
              setPermissionStatus(status.state as 'prompt' | 'granted' | 'denied');
            };
          })
          .catch(() => {
            // ignore
          });
      }
    } else {
      setIsSupported(false);
      setError('Geolocation is not supported by this browser.');
    }
  }, []);

  // Handle new position from GPS
  const handlePositionSuccess = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy: acc, heading: head, speed: spd } = pos.coords;
    const now = Date.now();
    const newPoint = { lat: latitude, lng: longitude };

    setCurrentLocation(newPoint);
    setAccuracy(Math.round(acc));
    setHeading(head !== null && !isNaN(head) ? Math.round(head) : null);
    setSpeed(spd !== null && !isNaN(spd) ? Math.round(spd * 10) / 10 : null);
    setError(null);
    setPermissionStatus('granted');

    // Only append to route path if position changed by at least 2.5 meters to prevent jitter
    if (lastPointRef.current) {
      const dist = calculateHaversineDistance(
        lastPointRef.current.lat,
        lastPointRef.current.lng,
        latitude,
        longitude
      );

      // Filtering threshold: minimum 2.5m, maximum 100m (reject GPS jumps)
      if (dist >= 2.5 && dist < 120) {
        lastPointRef.current = newPoint;
        setRoutePath((prev) => [...prev, { lat: latitude, lng: longitude, timestamp: now }]);
        setGpsDistanceMeters((prev) => Math.round(prev + dist));
      }
    } else {
      lastPointRef.current = newPoint;
      setRoutePath([{ lat: latitude, lng: longitude, timestamp: now }]);
    }
  }, []);

  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    console.warn('Geolocation watch error:', err.message);
    if (err.code === err.PERMISSION_DENIED) {
      setPermissionStatus('denied');
      setError('Location permission denied. Please allow location access to trace your route on the map.');
    } else {
      setError(err.message || 'Unable to retrieve location.');
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    try {
      const id = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        handlePositionError,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 1000,
        }
      );
      watchIdRef.current = id;
      setIsTracking(true);
    } catch (e) {
      console.warn('Error starting geolocation watch:', e);
    }
  }, [handlePositionSuccess, handlePositionError]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const resetRoute = useCallback(() => {
    setRoutePath([]);
    setGpsDistanceMeters(0);
    lastPointRef.current = null;
  }, []);

  // Simulation of an active run loop
  const startSimulation = useCallback(() => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setIsSimulating(true);
    setIsTracking(true);
    setError(null);

    simIndexRef.current = 0;
    const startPt = SIMULATION_POINTS[0];
    setCurrentLocation(startPt);
    lastPointRef.current = startPt;
    setAccuracy(4);
    setRoutePath([{ lat: startPt.lat, lng: startPt.lng, timestamp: Date.now() }]);

    simTimerRef.current = setInterval(() => {
      simIndexRef.current = (simIndexRef.current + 1) % SIMULATION_POINTS.length;
      const pt = SIMULATION_POINTS[simIndexRef.current];
      const now = Date.now();

      setCurrentLocation(pt);

      if (lastPointRef.current) {
        const dist = calculateHaversineDistance(
          lastPointRef.current.lat,
          lastPointRef.current.lng,
          pt.lat,
          pt.lng
        );
        setGpsDistanceMeters((prev) => Math.round(prev + dist));
      }
      lastPointRef.current = pt;
      setRoutePath((prev) => [...prev, { lat: pt.lat, lng: pt.lng, timestamp: now }]);
    }, 1500);
  }, []);

  const stopSimulation = useCallback(() => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    setIsSimulating(false);
  }, []);

  // Automatically start tracking when workout is active
  useEffect(() => {
    if (isWorkoutActive && !isSimulating) {
      startTracking();
    } else if (!isWorkoutActive && !isSimulating) {
      stopTracking();
    }
  }, [isWorkoutActive, isSimulating, startTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [stopTracking]);

  return {
    isSupported,
    isTracking,
    currentLocation,
    accuracy,
    heading,
    speed,
    routePath,
    gpsDistanceMeters,
    permissionStatus,
    error,
    startTracking,
    stopTracking,
    resetRoute,
    isSimulating,
    startSimulation,
    stopSimulation,
  };
}
