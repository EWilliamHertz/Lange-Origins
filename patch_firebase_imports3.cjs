const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';",
  "import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, deleteDoc, updateDoc, increment, orderBy, query, limit } from 'firebase/firestore';"
);

code = code.replace(
  "         const { orderBy, query, limit } = require('firebase/firestore');",
  ""
);

code = code.replace(
  "         const { doc, updateDoc, increment } = await import('firebase/firestore');",
  ""
);

code = code.replace(
  "        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');",
  ""
);

code = code.replace(
  "                      import('firebase/firestore').then(({ setDoc, doc, serverTimestamp }) => {\n",
  ""
);

code = code.replace(
  "                         });\n                      });",
  "                         });"
);

code = code.replace(
  "                      import('firebase/firestore').then(({ deleteDoc, doc }) => {\n",
  ""
);

fs.writeFileSync('src/App.tsx', code);
console.log("Firebase imports patched 3.");
