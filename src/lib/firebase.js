import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

/* Deliberately the plain default here — no experimentalForceLongPolling,
   no persistentLocalCache. Both were tried to chase performance and
   correlated with real writes failing to reach the server on real
   devices (twice), even though neither issue reproduced in testing.
   Reliability matters more than the optimization; don't re-add either
   without a way to verify them on the actual devices this app runs on,
   not just this dev environment. */
export const db = getFirestore(app);
