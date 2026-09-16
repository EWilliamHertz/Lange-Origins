const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const app = initializeApp({ projectId: "test" });
try {
  getFirestore(app, "hello");
  console.log("client works");
} catch(e) {
  console.log("client error:", e.message);
}
