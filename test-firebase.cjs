try {
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp } = require('firebase-admin/app');
initializeApp();
getFirestore("hello");
} catch(e) { console.log(e.message); }
