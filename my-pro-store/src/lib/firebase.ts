import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  Firestore, 
  initializeFirestore, 
  memoryLocalCache 
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

// --- 1. EDGE RUNTIME POLYFILL ---
// This prevents "navigator is not defined" crashes on Cloudflare/Edge
if (typeof window === "undefined" && typeof globalThis.navigator === "undefined") {
  (globalThis as any).navigator = {
    userAgent: "node", // Fakes the user agent so Firestore checks pass
  };
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 2. Initialize App (Singleton Pattern)
let app: FirebaseApp;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  app = {} as FirebaseApp; 
}

// 3. Initialize Firestore (Edge Optimized)
let db: Firestore;
try {
  // We use memoryLocalCache because Edge Runtime has no IndexedDB/LocalStorage
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
} catch (e) {
  // If it was already initialized, we just retrieve the existing instance
  try {
     db = getFirestore(app);
  } catch (err) {
     console.warn("Firestore init failed:", err);
     db = {} as Firestore;
  }
}

// 4. Initialize Storage
let storage: FirebaseStorage;
try {
   storage = getStorage(app);
} catch (e) {
   console.warn("Storage init failed:", e);
   storage = {} as FirebaseStorage;
}

// 5. Initialize Auth & Analytics SAFELY
// These are browser-only features, so we wrap them carefully
let auth: Auth = {} as Auth; 
let provider: GoogleAuthProvider = new GoogleAuthProvider();
let analytics: Analytics | null = null;

if (typeof window !== "undefined" && app.name) {
  try {
    auth = getAuth(app);
    
    // Only load analytics in the browser
    isSupported().then((yes) => {
      if (yes) analytics = getAnalytics(app);
    });
  } catch (e) {
    console.error("Auth init error:", e);
  }
}

export { app, db, storage, auth, analytics, provider };