const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `  useEffect(() => {
    if (appState === 'playing' && hotbar.length > 0) {
      // Check if they have grappling hook
      const hasHook = hotbar.some(item => item && item.type === 105) || backpack.some(item => item && item.type === 105);
      if (!hasHook) {
        setHotbar(prev => {
          const next = [...prev];
          // Try to find empty slot
          let emptyIdx = next.findIndex(item => !item);
          if (emptyIdx === -1) {
            // Replace a fist or something less important
            emptyIdx = next.findIndex(item => item && item.type === 103);
          }
          if (emptyIdx === -1) emptyIdx = 2; // just overwrite slot 3
          
          next[emptyIdx] = { type: 105, count: 1 };
          return next;
        });
      }
    }
  }, [appState]);

  useEffect(() => {
    if (appState === 'playing') {
      Sounds.startWind();`;

code = code.replace(
  `  useEffect(() => {
    if (appState === 'playing') {
      Sounds.startWind();`,
  replacement
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added auto-grappling hook injection');
