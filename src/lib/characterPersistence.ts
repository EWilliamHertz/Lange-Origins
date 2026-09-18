/**
 * Revision-guarded character persistence (roadmap Phase 1, items 2 + 4).
 *
 * Saves run inside a Firestore transaction that checks the document's
 * `revision` counter before writing. Two tabs (or a stale retry) racing on
 * the same character cannot silently overwrite each other: the lagging write
 * fails with `StaleCharacterError` and the caller decides how to recover.
 */

import {
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import { CHARACTER_SCHEMA_VERSION, type CharacterDoc } from './characterSchema';

export class StaleCharacterError extends Error {
  constructor(public readonly profileId: string) {
    super(`Stale write rejected for character ${profileId}`);
    this.name = 'StaleCharacterError';
  }
}

export class CharacterMissingError extends Error {
  constructor(public readonly profileId: string) {
    super(`Character ${profileId} no longer exists`);
    this.name = 'CharacterMissingError';
  }
}

export function characterDocRef(db: Firestore, uid: string, profileId: string) {
  return doc(db, 'users', uid, 'characters_v2', profileId);
}

function revisionOf(data: Record<string, unknown> | undefined): number {
  const rev = data?.revision;
  return typeof rev === 'number' && Number.isFinite(rev) && rev >= 0 ? Math.floor(rev) : 0;
}

/** Create a brand-new character document at revision 1. */
export async function createCharacterDoc(
  db: Firestore,
  uid: string,
  character: CharacterDoc,
): Promise<number> {
  const payload: Record<string, unknown> = { ...character, revision: 1, schemaVersion: CHARACTER_SCHEMA_VERSION };
  delete payload.id; // the document id carries it
  await setDoc(characterDocRef(db, uid, character.id), payload);
  return 1;
}

/**
 * Save character fields only if the stored revision matches `expectedRevision`.
 * Resolves with the new revision on success.
 */
export async function saveCharacterDoc(
  db: Firestore,
  uid: string,
  profileId: string,
  fields: Record<string, unknown>,
  expectedRevision: number,
): Promise<number> {
  const ref = characterDocRef(db, uid, profileId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new CharacterMissingError(profileId);
    const current = revisionOf(snap.data() as Record<string, unknown>);
    if (current !== expectedRevision) throw new StaleCharacterError(profileId);
    const next = current + 1;
    tx.update(ref, { ...fields, revision: next, schemaVersion: CHARACTER_SCHEMA_VERSION });
    return next;
  });
}

/** Read the current stored revision (e.g. to recover after a stale write). */
export async function readCharacterRevision(
  db: Firestore,
  uid: string,
  profileId: string,
): Promise<number | null> {
  const snap = await getDoc(characterDocRef(db, uid, profileId));
  if (!snap.exists()) return null;
  return revisionOf(snap.data() as Record<string, unknown>);
}

export async function deleteCharacterDoc(
  db: Firestore,
  uid: string,
  profileId: string,
): Promise<void> {
  await deleteDoc(characterDocRef(db, uid, profileId));
}
