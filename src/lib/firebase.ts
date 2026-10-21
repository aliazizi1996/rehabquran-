import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  doc, 
  getDoc, 
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

// Public Firebase configuration for client-side Web SDK (no secrets)
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (process.env as any || {});
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey || 'AIzaSyAUgU0A8eSb6HusDiyZxEjGRWsqCSc5TSE',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain || 'flawless-cacao-n4r4b.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId || 'flawless-cacao-n4r4b',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket || 'flawless-cacao-n4r4b.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId || '676593542004',
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId || '1:676593542004:web:fa56fe0a9f962d8ea1c221',
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Database ID from VITE_ environment variable or configuration
const rawDbId = env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (firebaseConfigData as any)?.firestoreDatabaseId;
const firestoreDbId = (rawDbId && rawDbId !== '(default)') ? rawDbId : undefined;

// Initialize Firestore with IndexedDB persistent cache and auto-detecting long-polling for reliable connectivity
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalAutoDetectLongPolling: true,
    },
    firestoreDbId
  );
} catch {
  try {
    firestoreInstance = initializeFirestore(
      app,
      { experimentalAutoDetectLongPolling: true },
      firestoreDbId
    );
  } catch {
    firestoreInstance = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);
  }
}

export const db: Firestore = firestoreInstance;

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

export async function getFirebaseAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

// Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

// Graceful connection test helper without blocking or throwing unhandled errors
let isConnectedCache: boolean | null = null;

export async function testFirestoreConnection(): Promise<boolean> {
  if (isConnectedCache !== null) return isConnectedCache;

  try {
    // Check connection with getDoc to allow seamless local cache & online sync
    await getDoc(doc(db, 'test', 'connection'));
    isConnectedCache = true;
    return true;
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (
      errorMsg.includes('the client is offline') || 
      errorMsg.includes('unavailable') || 
      errorMsg.includes('Could not reach') ||
      errorMsg.includes('network')
    ) {
      isConnectedCache = false;
      return false;
    }
    // Any permission or document-missing response is a valid connection
    isConnectedCache = true;
    return true;
  }
}
