import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const updatedFetch = `
  useEffect(() => {
    if (appState === 'serverBrowser') {
      fetch('/api/servers').then(r => r.json()).then(data => {
        if (data && data.servers) setPublicServers(data.servers);
      }).catch(console.error);
      
      // Fetch blueprints
      import('firebase/firestore').then(async ({ collection, getDocs, orderBy, query, limit }) => {
         try {
             const bpsSnap = await getDocs(query(collection(db, 'market_blueprints'), orderBy('likes', 'desc'), limit(50)));
             setMarketBlueprints(bpsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
         } catch (err) {
             console.error("Failed to load blueprints:", err);
         }
      });
    }
  }, [appState]);
`;

code = code.replace(/useEffect\(\(\) => \{\n\s*if \(appState === 'serverBrowser'\) \{[\s\S]*?\}\n\s*\}, \[appState\]\);/, updatedFetch);
fs.writeFileSync('src/App.tsx', code);
