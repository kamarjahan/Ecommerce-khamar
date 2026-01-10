// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // <--- 1. ADD GoogleAuthProvider HERE
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAwrjuyt7Ae3imQi8mgdR2Ii85SALIEr0g",
  authDomain: "my-store-21.firebaseapp.com",
  projectId: "my-store-21",
  storageBucket: "my-store-21.firebasestorage.app",
  messagingSenderId: "12492785330",
  appId: "1:12492785330:web:409863d44586b23bae6bab",
  measurementId: "G-SPM1C9SH56"
};

// Singleton pattern to prevent re-initialization errors in Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider(); // <--- 2. ADD THIS LINE

export { app, auth, db, storage, provider }; // <--- 3. ADD 'provider' TO EXPORTS