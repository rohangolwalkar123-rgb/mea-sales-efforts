import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

/* Some networks (corporate proxies, VPNs, certain firewalls) silently
   block Firestore's default WebChannel/streaming connection instead of
   erroring — reads/writes just hang forever with nothing to catch.
   experimentalAutoDetectLongPolling makes the SDK detect that case and
   fall back to plain long-polling, which works through anything that
   supports regular HTTP.

   persistentLocalCache keeps a copy of everything in IndexedDB, so once
   a browser has loaded the data once, every later visit renders from
   that local cache instantly while the live listener catches up in the
   background — the slow first-load round-trip only has to happen once
   per device. */
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache(),
});
