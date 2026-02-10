import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
const db = getFirestore(app);
const storage = getStorage(app);
const auth = typeof window !== "undefined" ? getAuth(app) : (undefined as any);
const provider = typeof window !== "undefined" ? new GoogleAuthProvider() : (undefined as any);

export { app, db, storage, auth, provider };
