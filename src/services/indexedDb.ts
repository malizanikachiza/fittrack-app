import { DailySummary, UserProfile, WorkoutSession } from '../types/fitness';

const DB_NAME = 'fittrack_offline_db';
const DB_VERSION = 1;

const STORE_PROFILE = 'profile';
const STORE_WORKOUTS = 'workouts';
const STORE_DAILY_TOTALS = 'daily_totals';
const STORE_META = 'sync_meta';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_PROFILE)) {
        db.createObjectStore(STORE_PROFILE);
      }
      if (!db.objectStoreNames.contains(STORE_WORKOUTS)) {
        db.createObjectStore(STORE_WORKOUTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_DAILY_TOTALS)) {
        db.createObjectStore(STORE_DAILY_TOTALS, { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Profile operations
export async function getIDBProfile(): Promise<UserProfile | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROFILE, 'readonly');
      const store = tx.objectStore(STORE_PROFILE);
      const req = store.get('current');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] getIDBProfile error:', err);
    return null;
  }
}

export async function saveIDBProfile(profile: UserProfile): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROFILE, 'readwrite');
      const store = tx.objectStore(STORE_PROFILE);
      const req = store.put(profile, 'current');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] saveIDBProfile error:', err);
  }
}

// Workouts operations
export async function getIDBWorkouts(): Promise<WorkoutSession[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_WORKOUTS, 'readonly');
      const store = tx.objectStore(STORE_WORKOUTS);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as WorkoutSession[]) || [];
        // Sort descending by startTime
        items.sort((a, b) => b.startTime - a.startTime);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] getIDBWorkouts error:', err);
    return [];
  }
}

export async function saveIDBWorkouts(sessions: WorkoutSession[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_WORKOUTS, 'readwrite');
      const store = tx.objectStore(STORE_WORKOUTS);
      store.clear();
      sessions.forEach((s) => store.put(s));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] saveIDBWorkouts error:', err);
  }
}

export async function saveIDBWorkout(session: WorkoutSession): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_WORKOUTS, 'readwrite');
      const store = tx.objectStore(STORE_WORKOUTS);
      const req = store.put(session);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] saveIDBWorkout error:', err);
  }
}

export async function deleteIDBWorkout(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_WORKOUTS, 'readwrite');
      const store = tx.objectStore(STORE_WORKOUTS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] deleteIDBWorkout error:', err);
  }
}

export async function clearIDBWorkouts(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_WORKOUTS, 'readwrite');
      const store = tx.objectStore(STORE_WORKOUTS);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] clearIDBWorkouts error:', err);
  }
}

// Daily totals operations
export async function getIDBDailyTotals(): Promise<DailySummary[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DAILY_TOTALS, 'readonly');
      const store = tx.objectStore(STORE_DAILY_TOTALS);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as DailySummary[]) || [];
        items.sort((a, b) => b.date.localeCompare(a.date));
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] getIDBDailyTotals error:', err);
    return [];
  }
}

export async function saveIDBDailyTotals(totals: DailySummary[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DAILY_TOTALS, 'readwrite');
      const store = tx.objectStore(STORE_DAILY_TOTALS);
      store.clear();
      totals.forEach((t) => store.put(t));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] saveIDBDailyTotals error:', err);
  }
}

// Metadata (sync state, timestamps)
export async function getIDBMeta<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_META, 'readonly');
      const store = tx.objectStore(STORE_META);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] getIDBMeta error:', err);
    return null;
  }
}

export async function setIDBMeta(key: string, value: any): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_META, 'readwrite');
      const store = tx.objectStore(STORE_META);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] setIDBMeta error:', err);
  }
}
