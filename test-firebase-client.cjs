try {
const { getFirestore } = require('firebase/firestore');
const { initializeApp } = require('firebase/app');
const app = initializeApp({ projectId: "test" });
getFirestore(app, "my-db");
} catch(e) { console.log(e.message); }
