import {
  APIProvider,
  AdvancedMarker,
  Map,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Crosshair,
  Flag,
  Layers,
  Maximize2,
  Minimize2,
  Navigation,
  Zap,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp?: number;
}

interface WorkoutMapProps {
  currentLocation: { lat: number; lng: number } | null;
  routePath: LocationPoint[];
  accuracy: number | null;
  speed: number | null;
  isTracking: boolean;
  isSimulating: boolean;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  className?: string;
  isExpandedDefault?: boolean;
}

// Inner helper component to render real-time glowing Google Maps Polyline
function RoutePolyline({ path }: { path: LocationPoint[] }) {
  const map = useMap();
  const glowPolylineRef = useRef<google.maps.Polyline | null>(null);
  const mainPolylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    const latLngPath = path.map((p) => ({ lat: p.lat, lng: p.lng }));

    // 1. Outer subtle glow stroke
    if (!glowPolylineRef.current) {
      glowPolylineRef.current = new google.maps.Polyline({
        path: latLngPath,
        geodesic: true,
        strokeColor: '#059669',
        strokeOpacity: 0.45,
        strokeWeight: 8,
        map,
      });
    } else {
      glowPolylineRef.current.setPath(latLngPath);
      glowPolylineRef.current.setMap(map);
    }

    // 2. Inner vibrant athletic emerald stroke
    if (!mainPolylineRef.current) {
      mainPolylineRef.current = new google.maps.Polyline({
        path: latLngPath,
        geodesic: true,
        strokeColor: '#10b981',
        strokeOpacity: 0.98,
        strokeWeight: 4,
        map,
      });
    } else {
      mainPolylineRef.current.setPath(latLngPath);
      mainPolylineRef.current.setMap(map);
    }

    return () => {
      if (glowPolylineRef.current) {
        glowPolylineRef.current.setMap(null);
      }
      if (mainPolylineRef.current) {
        mainPolylineRef.current.setMap(null);
      }
    };
  }, [map, path]);

  return null;
}

// Inner helper component to auto-pan camera to current position during live workout
function CameraCenterFollower({
  center,
  shouldFollow,
}: {
  center: { lat: number; lng: number } | null;
  shouldFollow: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (map && center && shouldFollow) {
      map.panTo(center);
    }
  }, [map, center, shouldFollow]);

  return null;
}

// Inner helper to fit bounds when viewing completed route
function RouteBoundsFitter({
  path,
  isTracking,
}: {
  path: LocationPoint[];
  isTracking: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || isTracking || path.length < 2) return;

    try {
      const bounds = new google.maps.LatLngBounds();
      path.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
    } catch {
      // bounds fallback
    }
  }, [map, path, isTracking]);

  return null;
}

export const WorkoutMap: React.FC<WorkoutMapProps> = ({
  currentLocation,
  routePath,
  accuracy,
  speed,
  isTracking,
  isSimulating,
  onStartSimulation,
  onStopSimulation,
  className = '',
  isExpandedDefault = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(isExpandedDefault);
  const [autoCenter, setAutoCenter] = useState<boolean>(true);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');

  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCwRQXBrlv2lWAqPFbG-jT_Os9vkRATpow';

  // Default coordinate (fallback to Central Park loop if no GPS yet)
  const defaultPos = currentLocation || { lat: 40.7829, lng: -73.9654 };

  // Starting location pin
  const startPoint = routePath.length > 0 ? routePath[0] : null;

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-slate-800 bg-[#0b101b] transition-all duration-300 relative shadow-xl ${
        isExpanded ? 'h-96 sm:h-[480px]' : 'h-64 sm:h-72'
      } ${className}`}
    >
      <APIProvider apiKey={apiKey} solutionChannel="gmp_mcp_codeassist_v1_aistudio">
        <Map
          defaultCenter={defaultPos}
          defaultZoom={16}
          gestureHandling="greedy"
          disableDefaultUI={true}
          mapId="DEMO_MAP_ID"
          mapTypeId={mapType}
          colorScheme="DARK"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
          onDragstart={() => setAutoCenter(false)}
        >
          {/* Traced Polyline Path */}
          <RoutePolyline path={routePath} />

          {/* Auto center camera watcher */}
          <CameraCenterFollower center={currentLocation} shouldFollow={autoCenter} />

          {/* Auto fit bounds when inspecting completed route */}
          <RouteBoundsFitter path={routePath} isTracking={isTracking} />

          {/* Start Point Marker */}
          {startPoint && routePath.length > 1 && (
            <AdvancedMarker position={startPoint} title="Workout Start Point">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 border-2 border-emerald-400 text-emerald-400 shadow-xl">
                <Flag className="w-3.5 h-3.5 fill-emerald-400" />
              </div>
            </AdvancedMarker>
          )}

          {/* Live Current User Marker */}
          {currentLocation && (
            <AdvancedMarker position={currentLocation} title="Current Location">
              <div className="relative flex items-center justify-center">
                {/* Outer pulsing wave */}
                <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-emerald-400 opacity-60" />
                {/* High-visibility glass ring */}
                <div className="w-7 h-7 rounded-full bg-emerald-500/25 backdrop-blur-sm flex items-center justify-center border border-emerald-400/90 shadow-lg">
                  {/* Center core */}
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 flex items-center justify-center shadow-inner">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>

      {/* Floating Top Header Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-medium text-slate-200 pointer-events-auto shadow-lg">
          <span
            className={`w-2 h-2 rounded-full ${
              isTracking
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-slate-500'
            }`}
          />
          <span className="font-semibold text-white">
            {isTracking ? 'GPS Tracing' : 'Route Ready'}
          </span>
          {accuracy !== null && (
            <span className="text-[10px] text-slate-400 font-mono">
              (±{accuracy}m)
            </span>
          )}
          {routePath.length > 0 && (
            <span className="text-[10px] text-emerald-400 font-mono pl-1.5 border-l border-slate-800">
              {routePath.length} pts
            </span>
          )}
        </div>

        {/* Right Action Icons: Layer toggle, Center & Expand */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Map Type (Satellite / Dark Vector) */}
          <button
            onClick={() => setMapType(mapType === 'roadmap' ? 'hybrid' : 'roadmap')}
            className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-lg cursor-pointer"
            title={mapType === 'roadmap' ? 'Switch to Satellite' : 'Switch to Roadmap'}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Recenter */}
          <button
            onClick={() => setAutoCenter(true)}
            className={`p-2 rounded-xl backdrop-blur-md border transition shadow-lg cursor-pointer ${
              autoCenter
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
            title="Recenter camera on current location"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Expand / Minimize */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md text-slate-300 border border-slate-800 hover:text-white hover:bg-slate-800 transition shadow-lg cursor-pointer"
            title={isExpanded ? 'Collapse map' : 'Expand map'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Floating Bottom Quick Simulation Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 pointer-events-auto shadow-md flex items-center gap-2">
          {speed !== null && speed > 0 ? (
            <span className="font-mono text-emerald-400 font-bold">
              {(speed * 3.6).toFixed(1)} km/h
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-300">
              <Navigation className="w-3 h-3 text-emerald-400" />
              <span>Breadcrumb GPS Active</span>
            </span>
          )}
        </div>

        {/* Simulation toggle button for desktop testing */}
        <div className="pointer-events-auto">
          <button
            onClick={() => {
              if (isSimulating) {
                onStopSimulation();
              } else {
                setAutoCenter(true);
                onStartSimulation();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border shadow-lg transition cursor-pointer ${
              isSimulating
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-slate-900/90 text-amber-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{isSimulating ? 'Stop Demo Run' : 'Simulate Outdoor Run'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
