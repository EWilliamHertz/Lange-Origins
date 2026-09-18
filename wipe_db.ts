import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore("ai-studio-langeorigins-54731c1b-d12d-444f-a752-9f96409d3384");

async function wipe() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  for (const doc of snapshot.docs) {
    const profilesRef = doc.ref.collection('profiles');
    const pSnap = await profilesRef.get();
    for (const p of pSnap.docs) {
      await p.ref.delete();
      console.log('Deleted profile', p.id);
    }
  }
  console.log('Done wiping profiles.');
  process.exit(0);
}
wipe();
