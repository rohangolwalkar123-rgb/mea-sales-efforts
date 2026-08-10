import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

/* Reproduced directly (not just reported): with the plain default
   transport, writes silently never reach the server at all — no error,
   no timeout, nothing. experimentalForceLongPolling fixes that
   specific, confirmed failure. persistentLocalCache is deliberately
   NOT included here — that was a separate change, tried at the same
   time as this one, and never verified in isolation. Don't re-add it
   without testing this exact transport setting on its own first. */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
