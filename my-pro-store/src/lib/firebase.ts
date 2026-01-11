import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 1. Initialize App (Singleton)
let app: FirebaseApp;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  app = {} as FirebaseApp; 
}

// 2. Initialize Firestore & Storage with explicit types
let db: Firestore;
let storage: FirebaseStorage;

try {
   db = getFirestore(app);
   storage = getStorage(app);
} catch (e) {
   console.warn("Firestore/Storage init failed:", e);
   db = {} as Firestore;
   storage = {} as FirebaseStorage;
}

// 3. Initialize Auth & Analytics SAFELY
let auth: Auth = {} as Auth; 
let provider: GoogleAuthProvider = new GoogleAuthProvider();
let analytics: Analytics | null = null;

if (typeof window !== "undefined" && app.name) {
  try {
    auth = getAuth(app);
    // Provider is already initialized above, but we can ensure it here if needed
    
    isSupported().then((yes) => {
      if (yes) analytics = getAnalytics(app);
    });
  } catch (e) {
    console.error("Auth init error:", e);
  }
}

export { app, db, storage, auth, analytics, provider };