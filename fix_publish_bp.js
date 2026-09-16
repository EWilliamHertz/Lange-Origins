import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const publishFn = `
  const publishBlueprint = async () => {
     if (!currentUser) return;
     const roomId = window.prompt("Enter the exact ID of the Private Server you want to publish:");
     if (!roomId) return;
     const bpName = window.prompt("Give your Blueprint a catchy title:");
     if (!bpName) return;
     const desc = window.prompt("Write a short description (e.g. Parkour map, 1v1 Arena, Chill Hub):");
     if (!desc) return;
     
     try {
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const newBp = {
           roomId,
           name: bpName,
           description: desc,
           creatorId: currentUser.uid,
           creatorName: currentUser.displayName || 'Unknown Builder',
           likes: 0,
           createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'market_blueprints', roomId + '_' + currentUser.uid), newBp);
        alert("Successfully published your Blueprint to the Community Marketplace!");
        setMarketBlueprints(prev => [{ id: roomId + '_' + currentUser.uid, ...newBp }, ...prev]);
     } catch (err) {
        console.error("Failed to publish blueprint:", err);
        alert("Failed to publish. Check console.");
     }
  };
`;

code = code.replace(/const joinServer = \(name: string\) => \{/, publishFn + "\n  const joinServer = (name: string) => {");

fs.writeFileSync('src/App.tsx', code);
