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

// 1. Initialize App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Firestore & Storage (Safe for Edge)
const db = getFirestore(app);
const storage = getStorage(app);

// 3. Initialize Auth & Analytics ONLY in the Browser (Prevents Edge Crash)
let auth: any = null;
let provider: any = null;
let analytics: any = null;

if (typeof window !== "undefined") {
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  
  isSupported().then((yes) => {
    if (yes) analytics = getAnalytics(app);
  });
}

export { app, db, storage, auth, analytics, provider };