import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ credential: applicationDefault() });
try {
  const db = getFirestore("ai-studio-langeorigins-54731c1b-d12d-444f-a752-9f96409d3384");
  console.log("DB initialized");
} catch (e) {
  console.log(e);
}
