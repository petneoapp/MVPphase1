// lib/firebase/requestNotificationPermission.ts
import { getToken, onMessage  } from "firebase/messaging";
import { messaging } from "./firebase";

export const requestNotificationPermission = async (): Promise<string | null> => {
    try {
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            console.log("Notification permission denied");
            return null;
        }

        if (!messaging) {
            console.warn("Firebase Messaging is not initialized or supported in this browser. Skipping token retrieval.");
            return null;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register(
            "/api/firebase-messaging-sw"
        );

        // Get FCM token
        const currentToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (currentToken) {
            console.log("FCM Token:", currentToken);
            return currentToken;
        }
    } catch (error) {
        console.error("Error getting notification permission:", error);
    }
    return null;
};

export const setupForegroundNotifications = () => {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);

        // Show custom notification UI or use browser notification
        new Notification(payload.notification?.title || "New Notification", {
            body: payload.notification?.body,
            icon: payload.notification?.icon || '/icon.png'
        });
    });
};
