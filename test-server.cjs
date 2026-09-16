const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
initializeApp({ credential: applicationDefault() });
try {
  const db = getFirestore("ai-studio-langeorigins-54731c1b-d12d-444f-a752-9f96409d3384");
  console.log("Success");
} catch(e) {
  console.log("Error:", e.message);
}
