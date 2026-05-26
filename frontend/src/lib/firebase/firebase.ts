// lib/firebase/firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { Messaging, getMessaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: any = null;

if (typeof window !== "undefined") {
    // Check if critical configuration values are present
    const hasConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
    
    if (hasConfig) {
        try {
            app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        } catch (appError) {
            console.error("Firebase App initialization failed:", appError);
        }
    } else {
        console.warn("Firebase configuration is missing or incomplete. Messaging features will be disabled.");
    }
}

export { app };

export const messaging: Messaging | null =
  typeof window !== "undefined" && app
    ? getMessaging(app)
    : null;

