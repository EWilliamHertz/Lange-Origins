/**
 * Character lifecycle tests against the Firebase emulators
 * (roadmap Phase 1, item 3).
 *
 * Covers create → load → save → reload → stale-write rejection → delete,
 * plus Firestore-rules permission checks (a second user cannot read or write
 * someone else's characters).
 *
 * Runs only when the emulators are up — e.g. via `npm run test:emulators` or
 * the CI `lifecycle-emulators` job. Otherwise the suite is skipped so plain
 * `npm test` stays runnable everywhere.
 */
import { afterAll, describe, expect, it } from 'vitest';

const emulatorEnabled = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST,
);
const describeSuite = emulatorEnabled ? describe : describe.skip;

describeSuite('character lifecycle (Firebase emulators)', () => {
  // Imports are deferred so `npm test` without emulators never loads the SDK.
  let app: any, auth: any, db: any;
  let cachedCtx: any = null;
  let aliceUid = '';
  let bobUid = '';

  const lazySetup = async () => {
    if (cachedCtx) return cachedCtx;
    const { initializeApp } = await import('firebase/app');
    const { getAuth, createUserWithEmailAndPassword, connectAuthEmulator, signOut } = await import('firebase/auth');
    const { getFirestore, connectFirestoreEmulator } = await import('firebase/firestore');
    const { decodeCharacterDoc, createDefaultCharacterDoc } = await import('../src/lib/characterSchema');
    const {
      createCharacterDoc, saveCharacterDoc, readCharacterRevision, deleteCharacterDoc, characterDocRef,
    } = await import('../src/lib/characterPersistence');
    const { getDoc, getDocs, collection } = await import('firebase/firestore');

    app = initializeApp({ projectId: 'demo-lange-origins', apiKey: 'demo-api-key' }, 'lifecycle-test');
    auth = getAuth(app);
    db = getFirestore(app);
    connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
    connectFirestoreEmulator(db, ...splitHost(process.env.FIRESTORE_EMULATOR_HOST!));

    const alice = await createUserWithEmailAndPassword(auth, 'alice@example.com', 'password123');
    aliceUid = alice.user.uid;
    cachedCtx = { decodeCharacterDoc, createDefaultCharacterDoc, createCharacterDoc, saveCharacterDoc, readCharacterRevision, deleteCharacterDoc, characterDocRef, getDoc, getDocs, collection, signOut };
    return cachedCtx;
  };

  function splitHost(hostPort: string): [string, number] {
    const [host, port] = hostPort.split(':');
    return [host, Number(port)];
  }

  afterAll(async () => {
    if (app) {
      const { deleteApp } = await import('firebase/app');
      await deleteApp(app).catch(() => {});
    }
  });

  it('create → load → save → reload → stale rejection → delete', async () => {
    const ctx = await lazySetup();
    if (!ctx) throw new Error('setup failed');
    const {
      decodeCharacterDoc, createDefaultCharacterDoc, createCharacterDoc, saveCharacterDoc,
      readCharacterRevision, deleteCharacterDoc, characterDocRef, getDoc, getDocs, collection,
    } = ctx;

    // --- create ---
    const character = createDefaultCharacterDoc({
      id: 'char_alice', name: 'Alice', race: 'elf', playerClass: 'mage',
      questsJson: JSON.stringify([{ id: 'q1', title: 'Getting Started', goal: 5, current: 0, completed: false }]),
    });
    const initialRevision = await createCharacterDoc(db, aliceUid, character);
    expect(initialRevision).toBe(1);

    // --- load (what the lobby does on sign-in) ---
    const snap = await getDocs(collection(db, 'users', aliceUid, 'characters_v2'));
    expect(snap.docs).toHaveLength(1);
    const { data: loaded, migrated } = decodeCharacterDoc({ ...snap.docs[0].data(), id: snap.docs[0].id });
    expect(migrated).toBe(false); // created via schema -> already current
    expect(loaded.name).toBe('Alice');
    expect(loaded.race).toBe('elf');
    expect(loaded.playerClass).toBe('mage');
    expect(loaded.revision).toBe(1);
    expect(JSON.parse(loaded.backpack)).toHaveLength(27);

    // --- save with the expected revision ---
    const rev2 = await saveCharacterDoc(db, aliceUid, 'char_alice', { health: 55, gold: 12 }, 1);
    expect(rev2).toBe(2);

    // --- reload sees the save ---
    const reread = await getDoc(characterDocRef(db, aliceUid, 'char_alice'));
    expect(reread.data()?.health).toBe(55);
    expect(reread.data()?.gold).toBe(12);
    expect(reread.data()?.revision).toBe(2);

    // --- a stale writer (second tab with revision 1) is rejected ---
    await expect(saveCharacterDoc(db, aliceUid, 'char_alice', { health: 1 }, 1))
      .rejects.toThrow(/Stale write rejected/);

    // --- recovery: adopt the remote revision and save again ---
    const remote = await readCharacterRevision(db, aliceUid, 'char_alice');
    expect(remote).toBe(2);
    const rev3 = await saveCharacterDoc(db, aliceUid, 'char_alice', { health: 77 }, remote!);
    expect(rev3).toBe(3);

    // --- delete ---
    await deleteCharacterDoc(db, aliceUid, 'char_alice');
    const gone = await getDoc(characterDocRef(db, aliceUid, 'char_alice'));
    expect(gone.exists()).toBe(false);
  }, 30_000);

  it('enforces owner-only permissions for other accounts', async () => {
    const ctx = await lazySetup();
    if (!ctx) throw new Error('setup failed');
    const {
      createDefaultCharacterDoc, createCharacterDoc, characterDocRef, getDoc, signOut,
    } = ctx;
    const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');
    const { setDoc } = await import('firebase/firestore');

    // Recreate Alice's character while signed in as Alice.
    await signInWithEmailAndPassword(auth, 'alice@example.com', 'password123');
    const character = createDefaultCharacterDoc({ id: 'char_alice2', name: 'Alice' });
    await createCharacterDoc(db, aliceUid, character);

    // Bob signs in and must neither read nor write Alice's character.
    const bob = await createUserWithEmailAndPassword(auth, 'bob@example.com', 'password123');
    bobUid = bob.user.uid;
    await expect(getDoc(characterDocRef(db, aliceUid, 'char_alice2'))).rejects.toThrow();
    await expect(setDoc(characterDocRef(db, aliceUid, 'char_alice2'), { gold: 999999 }))
      .rejects.toThrow();

    // Alice can still clean up her own document.
    await signInWithEmailAndPassword(auth, 'alice@example.com', 'password123');
    const { deleteCharacterDoc } = ctx;
    await deleteCharacterDoc(db, aliceUid, 'char_alice2');
    await signOut(auth);
  }, 30_000);
});
