import "server-only";
import admin from "firebase-admin";

if (!admin.apps.length) {
  // Check if keys exist to prevent build crash
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
    }
  } else {
    console.warn("⚠️ Firebase Admin Environment Variables missing. Skipping initialization.");
  }
}

// Export adminDb safely. If init failed, this might be undefined, so handle with care.
export const adminDb = admin.apps.length ? admin.firestore() : null as any;