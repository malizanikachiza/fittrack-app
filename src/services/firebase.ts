import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Firestore,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { DailySummary, UserProfile, WorkoutSession } from '../types/fitness';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your-api-key' &&
  firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY'
);

// Initialize Firebase App
let appInstance = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}

export const auth = authInstance;
export const db = dbInstance;
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

// Safe Auth operations
export async function loginWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error(
      'Firebase is not configured. Please add VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID to your environment.'
    );
  }
  const result = await signInWithPopup(auth, googleAuthProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

// Error handling helper conforming to Firebase skill guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
    },
  };
  console.error('[Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test server connection as per skill guideline
export async function testFirestoreConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline or connection not established yet.');
    }
    return false;
  }
}

// Data payload structure stored under users/{uid}
export interface UserCloudData {
  uid: string;
  profile: UserProfile;
  workoutHistory: WorkoutSession[];
  dailyTotals: DailySummary[];
  lastSyncedAt: number | any;
  updatedAt: number | any;
  clientVersion?: string;
}

/**
 * Fetch all user fitness data from Cloud Firestore under users/{uid}
 */
export async function fetchUserDataFromFirestore(uid: string): Promise<UserCloudData | null> {
  if (!db) return null;
  const userDocRef = doc(db, 'users', uid);

  try {
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      return null;
    }
    return docSnap.data() as UserCloudData;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

/**
 * Sync user profile, workout history, and daily totals to Cloud Firestore under users/{uid}
 */
export async function syncUserDataToFirestore(
  uid: string,
  payload: {
    profile: UserProfile;
    workoutHistory: WorkoutSession[];
    dailyTotals: DailySummary[];
  }
): Promise<void> {
  if (!db) return;
  const userDocRef = doc(db, 'users', uid);

  const cleanPayload: UserCloudData = {
    uid,
    profile: payload.profile,
    workoutHistory: payload.workoutHistory,
    dailyTotals: payload.dailyTotals,
    lastSyncedAt: Date.now(),
    updatedAt: serverTimestamp(),
    clientVersion: '1.0.0',
  };

  try {
    await setDoc(userDocRef, cleanPayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}
