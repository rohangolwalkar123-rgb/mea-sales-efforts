import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  getDocs,
  query,
  limit,
  writeBatch,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase";

/* Firestore-backed replacement for the old window.storage KV API.
   Entries live one-per-document (instead of one big array blob) so
   concurrent edits from different people/devices never clobber each
   other, and every client stays live-synced via onSnapshot. */

const entriesCol = collection(db, "entries");
const configDoc = (name) => doc(db, "config", name);

export function subscribeEntries(callback, onError) {
  return onSnapshot(
    entriesCol,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export async function addEntry(entry) {
  await setDoc(doc(entriesCol, entry.id), entry);
}

export async function updateEntry(id, updates) {
  await updateDoc(doc(entriesCol, id), { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteEntry(id) {
  await deleteDoc(doc(entriesCol, id));
}

/* Only runs the first time anyone opens the app against a fresh
   Firestore project — seeds the historical workbook data so the
   dashboard isn't empty on day one. The empty-check is just a cheap
   short-circuit; the real safety net is that seed doc IDs are
   deterministic ("seed-0", "seed-1", ...), so if this ever fires twice
   concurrently (e.g. React StrictMode double-invoking effects in dev,
   or two people opening the app at the same instant on a fresh
   project) the second run overwrites the same docs instead of
   creating duplicates. */
export async function seedIfEmpty(seedEntries) {
  const snap = await getDocs(query(entriesCol, limit(1)));
  if (!snap.empty) return;
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  seedEntries.forEach((e, i) => {
    const id = `seed-${i}`;
    batch.set(doc(entriesCol, id), { ...e, id, loggedAt: now });
  });
  await batch.commit();
}

export function subscribeTeam(callback, onError) {
  return onSnapshot(
    configDoc("team"),
    (snap) => callback(snap.exists() ? snap.data().members || [] : []),
    onError
  );
}

export async function addTeamMember(name) {
  await setDoc(configDoc("team"), { members: arrayUnion(name) }, { merge: true });
}

export async function getLastExport() {
  const snap = await getDoc(configDoc("lastExport"));
  return snap.exists() ? snap.data().value : null;
}

export async function setLastExport(value) {
  await setDoc(configDoc("lastExport"), { value });
}
