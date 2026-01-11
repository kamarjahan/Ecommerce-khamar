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
// This fixes the "ReferenceError: navigator is not defined" crash
if (typeof window === "undefined" && typeof globalThis.navigator === "undefined") {
  (globalThis as any).navigator = {
    userAgent: "node", // Fakes the user agent so Firestore doesn't think it's Safari
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

// 2. Initialize App (Singleton)
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
  // Use memory cache to avoid trying to access IndexedDB/LocalStorage on the server
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
} catch (e) {
  // Fallback if already initialized
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
let auth: Auth = {} as Auth; 
let provider: GoogleAuthProvider = new GoogleAuthProvider();
let analytics: Analytics | null = null;

if (typeof window !== "undefined" && app.name) {
  try {
    auth = getAuth(app);
    
    isSupported().then((yes) => {
      if (yes) analytics = getAnalytics(app);
    });
  } catch (e) {
    console.error("Auth init error:", e);
  }
}

export { app, db, storage, auth, analytics, provider };