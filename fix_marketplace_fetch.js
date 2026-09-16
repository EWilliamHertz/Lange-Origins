import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const updatedFetch = `
      // Fetch blueprints
      import('firebase/firestore').then(async ({ collection, getDocs, query, limit, orderBy }) => {
         try {
             const bpsSnap = await getDocs(query(collection(db, 'market_blueprints'), limit(50)));
             const bps = bpsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
             // Sort client-side to avoid needing an index
             bps.sort((a, b) => (b.likes || 0) - (a.likes || 0));
             setMarketBlueprints(bps);
         } catch (err) {
             console.error("Failed to load blueprints:", err);
         }
      });
`;

code = code.replace(/\/\/\ Fetch blueprints[\s\S]*?\}\n\s*\);/, updatedFetch);
fs.writeFileSync('src/App.tsx', code);
