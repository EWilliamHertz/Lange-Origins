const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// handleSignOut
code = code.replace(
  "        const { getAuth, signOut } = await import('firebase/auth');\n        const auth = getAuth();\n        await signOut(auth);",
  "        await logout();"
);

// buyBlueprint
const buyBlueprintsRepl = `
         const userDocRef = doc(db, 'users', currentUser.uid);
         await updateDoc(userDocRef, { balance: increment(-price) });
`;
code = code.replace(
  "         const { doc, updateDoc, increment } = await import('firebase/firestore');\n         const userDocRef = doc(db, 'users', currentUser.uid);\n         await updateDoc(userDocRef, { balance: increment(-price) });",
  buyBlueprintsRepl
);

// handleUploadBlueprint
const uploadBlueprintRepl = `
        const bpRef = doc(db, 'market_blueprints', 'bp_' + Date.now());
        await setDoc(bpRef, {
`;
code = code.replace(
  "        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');\n        const bpRef = doc(db, 'market_blueprints', 'bp_' + Date.now());\n        await setDoc(bpRef, {",
  uploadBlueprintRepl
);

fs.writeFileSync('src/App.tsx', code);
console.log("Firebase imports patched.");
