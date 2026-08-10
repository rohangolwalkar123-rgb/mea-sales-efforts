# MEA Sales Effort Tracker

A React (Vite) app for the MEA sales team to log client-facing activity and
view a live, shared dashboard. Data is stored in Firebase Firestore, so
everyone's laptop and phone stays in sync in real time. Login is a simple
name-picker (no password) — see the Security note below before sharing the
link widely.

## Local development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. The `.env` file already has this project's
Firebase config filled in — no extra setup needed to run it locally.

## Firestore security rules

Firestore starts locked down by default. Paste the contents of
[`firestore.rules`](./firestore.rules) into **Firebase Console → Firestore
Database → Rules → publish**, or deploy via the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # pick the existing mea-sales-tracker project
firebase deploy --only firestore:rules
```

Without this step, every read/write from the app will fail with a
"Missing or insufficient permissions" error.

## Deploying to Vercel

1. Push this project to a GitHub repo (Vercel deploys from git).
2. In [vercel.com](https://vercel.com), **New Project → import the repo**.
   Vercel auto-detects Vite — build command `npm run build`, output `dist`.
3. Before deploying, add the environment variables from `.env` under
   **Project Settings → Environment Variables** (same six `VITE_FIREBASE_*`
   keys). They need to be present at **build time** since Vite inlines them.
4. Deploy. You'll get a `https://<project>.vercel.app` URL that works from
   any laptop or phone.

## How data flows

- Every log/edit/delete talks directly to Firestore (see `src/lib/store.js`)
  — no custom backend server to run or maintain.
- `entries` collection: one document per logged activity. Real-time listeners
  (`onSnapshot`) mean everyone's dashboard updates live as the team logs
  entries, without needing to refresh.
- `config/team`: the roster of names that have ever logged in.
- `config/lastExport`: timestamp of the last "Export to Excel" click, shown
  as a staleness reminder banner.
- The very first time the app runs against a fresh (empty) Firestore
  database, it seeds the historical rows carried over from the original
  workbook (`SEED_ENTRIES` in `src/App.jsx`). This only happens once.

## Security note (read before sharing the link)

Login here is just "pick your name" — there's no password check, and the
Firestore rules currently allow open read/write to anyone who has the app's
public Firebase config (i.e. anyone who can load the page). This is fine for
an internal tool shared via a private link with a small trusted team, but:

- Don't post the Vercel URL somewhere public.
- If this needs real access control later, add Firebase Authentication
  (email/password or Google sign-in) and update `firestore.rules` to check
  `request.auth != null` (and optionally match `request.auth.token.email`
  against an allowed list).

## Project structure

```
src/
  main.jsx        entry point
  App.jsx          all UI components (login, dashboard, log form, detail table)
  lib/
    firebase.js    Firebase app + Firestore init (reads VITE_FIREBASE_* env vars)
    store.js       Firestore read/write/subscribe helpers used by App.jsx
```
