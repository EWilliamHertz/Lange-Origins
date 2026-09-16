const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
admin.initializeApp({ projectId: "test" });
try {
  getFirestore("hello");
  console.log("admin works");
} catch(e) {
  console.log("admin error:", e.message);
}
