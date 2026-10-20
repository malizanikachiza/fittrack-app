import { useCallback, useEffect, useRef, useState } from 'react';

interface BluetoothDeviceSimple {
  name?: string;
  gatt?: {
    connected?: boolean;
    connect: () => Promise<{
      getPrimaryService: (service: string) => Promise<{
        getCharacteristic: (characteristic: string) => Promise<BluetoothCharacteristicSimple>;
      }>;
    }>;
    disconnect: () => void;
  };
  addEventListener: (type: string, listener: (ev: Event) => void) => void;
}

interface BluetoothCharacteristicSimple {
  value?: DataView;
  startNotifications: () => Promise<BluetoothCharacteristicSimple>;
  addEventListener: (type: string, listener: (ev: Event) => void) => void;
  removeEventListener: (type: string, listener: (ev: Event) => void) => void;
}

export interface BluetoothHeartRateState {
  isSupported: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  currentBpm: number | null;
  error: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  isSimulating: boolean;
  startSimulation: (targetBpm?: number) => void;
  stopSimulation: () => void;
}

export function useBluetoothHeartRate(): BluetoothHeartRateState {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const deviceRef = useRef<BluetoothDeviceSimple | null>(null);
  const characteristicRef = useRef<BluetoothCharacteristicSimple | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  const handleCharacteristicValueChanged = (event: Event) => {
    const target = event.target as unknown as { value?: DataView };
    const value = target?.value;
    if (!value) return;

    // Bluetooth SIG Heart Rate Measurement Specification (0x2A37):
    // Byte 0: Flags
    // Bit 0: 0 = Heart Rate Value Format UINT8, 1 = UINT16
    const flags = value.getUint8(0);
    const is16Bit = (flags & 0x01) !== 0;

    let bpm = 0;
    if (is16Bit) {
      bpm = value.getUint16(1, true); // Little endian
    } else {
      bpm = value.getUint8(1);
    }

    if (bpm > 30 && bpm < 250) {
      setCurrentBpm(bpm);
    }
  };

  const handleDisconnected = () => {
    setIsConnected(false);
    setDeviceName(null);
    setCurrentBpm(null);
    characteristicRef.current = null;
    deviceRef.current = null;
  };

  const connect = useCallback(async (): Promise<boolean> => {
    setError(null);
    if (!isSupported) {
      setError('Web Bluetooth is not supported in this browser. Try Chrome/Edge on Desktop or Android.');
      return false;
    }

    setIsConnecting(true);

    try {
      const navBluetooth = (navigator as unknown as { bluetooth?: {
        requestDevice: (opts: unknown) => Promise<BluetoothDeviceSimple>;
      } }).bluetooth;

      if (!navBluetooth) {
        throw new Error('Web Bluetooth is not available in this environment.');
      }

      // Request device with Standard Heart Rate Service (0x180D)
      const device = await navBluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service'],
      });

      deviceRef.current = device;
      setDeviceName(device.name || 'Bluetooth Heart Rate Monitor');

      device.addEventListener('gattserverdisconnected', handleDisconnected);

      if (!device.gatt) {
        throw new Error('GATT server not found on device.');
      }

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');
      characteristicRef.current = characteristic;

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

      setIsConnected(true);
      setIsConnecting(false);
      return true;
    } catch (err: unknown) {
      console.warn('Bluetooth connection failed or canceled:', err);
      const msg = err instanceof Error ? err.message : 'Failed to connect to Bluetooth device.';
      if (!msg.includes('cancelled') && !msg.includes('canceled')) {
        setError(msg);
      }
      setIsConnecting(false);
      setIsConnected(false);
      return false;
    }
  }, [isSupported]);

  const disconnect = useCallback(() => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
      setIsSimulating(false);
    }

    if (characteristicRef.current) {
      try {
        characteristicRef.current.removeEventListener(
          'characteristicvaluechanged',
          handleCharacteristicValueChanged
        );
      } catch {
        // ignore
      }
      characteristicRef.current = null;
    }

    if (deviceRef.current && deviceRef.current.gatt && deviceRef.current.gatt.connected) {
      deviceRef.current.gatt.disconnect();
    }

    handleDisconnected();
  }, []);

  // Simulation mode for testing / desktop
  const startSimulation = useCallback((targetBpm: number = 135) => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setIsSimulating(true);
    setIsConnected(true);
    setDeviceName('BLE Strap Simulator');
    let bpm = targetBpm;
    setCurrentBpm(bpm);

    simTimerRef.current = setInterval(() => {
      // Natural biological heart rate drift ±2 bpm
      const delta = (Math.random() - 0.48) * 3;
      bpm = Math.round(Math.min(185, Math.max(70, bpm + delta)));
      setCurrentBpm(bpm);
    }, 1000);
  }, []);

  const stopSimulation = useCallback(() => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    setIsSimulating(false);
    setIsConnected(false);
    setDeviceName(null);
    setCurrentBpm(null);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isSupported,
    isConnected,
    isConnecting,
    deviceName,
    currentBpm,
    error,
    connect,
    disconnect,
    isSimulating,
    startSimulation,
    stopSimulation,
  };
}
