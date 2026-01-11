import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 1. Initialize App (Singleton)
// We wrap this in a try-catch to prevent the entire site from going down if config is wrong
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  // Create a dummy app object if initialization fails to keep the site alive
  app = {} as any; 
}

// 2. Initialize Firestore & Storage (These usually work on Edge)
let db, storage;
try {
   db = getFirestore(app);
   storage = getStorage(app);
} catch (e) {
   console.warn("Firestore/Storage init failed (expected on some edge runtimes):", e);
   db = {} as any;
   storage = {} as any;
}

// 3. Initialize Auth & Analytics SAFELY
// We default to a dummy object on the server to prevent "Cannot read properties of null" errors
let auth: any = {}; 
let provider: any = {};
let analytics: any = null;

if (typeof window !== "undefined" && app.name) {
  // We are in the Browser -> Initialize real Auth
  try {
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    isSupported().then((yes) => {
      if (yes) analytics = getAnalytics(app);
    });
  } catch (e) {
    console.error("Auth init error:", e);
  }
} else {
  // We are on the Server (Edge) -> Keep 'auth' as an empty object {}
  // This prevents crashes if a component tries to access 'auth.currentUser'
}

export { app, db, storage, auth, analytics, provider };