import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const upvoteFn = `
  const handleUpvote = async (bpId: string) => {
     if (!currentUser) return;
     try {
         const { doc, updateDoc, increment } = await import('firebase/firestore');
         await updateDoc(doc(db, 'market_blueprints', bpId), {
             likes: increment(1)
         });
         setMarketBlueprints(prev => prev.map(bp => bp.id === bpId ? { ...bp, likes: (bp.likes || 0) + 1 } : bp));
     } catch (err) {
         console.error("Failed to upvote:", err);
     }
  };
`;

code = code.replace(/const publishBlueprint = async \(\) => \{/, upvoteFn + "\n  const publishBlueprint = async () => {");
fs.writeFileSync('src/App.tsx', code);
