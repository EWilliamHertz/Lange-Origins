const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  credential: applicationDefault(),
  projectId: 'ai-studio-langeorigins-54731c1b-d12d-444f-a752-9f96409d3384'
});
const db = getFirestore();

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
}
wipe();
