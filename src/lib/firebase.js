import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

/* This app is used on networks where Firestore's default WebChannel
   streaming connection is slow or gets silently blocked (corporate
   proxies, VPNs, restrictive firewalls) — reads/writes can hang for a
   long time with nothing to catch.

   experimentalForceLongPolling skips the (slow, sometimes multi-second)
   auto-detection probe and goes straight to plain HTTP long-polling,
   which works through anything that supports regular HTTP requests.

   persistentLocalCache queues writes in IndexedDB, not just memory, so
   a write that's still in flight when the tab is refreshed doesn't just
   vanish — it survives the reload and keeps trying to sync. It also
   means a returning visitor's data renders instantly from the local
   cache instead of waiting on the network every time.
   persistentMultipleTabManager lets that cache work correctly even if
   someone has the app open in two tabs at once. */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
