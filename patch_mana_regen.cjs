const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regenHook = `
  // Mana Regeneration
  useEffect(() => {
    if (appState !== 'playing') return;
    const isMagicUnlocked = quests.find(q => q.id === 'q5')?.completed;
    if (!isMagicUnlocked) return;
    
    const interval = setInterval(() => {
       setMana(prev => Math.min(100, prev + 2));
    }, 1000);
    return () => clearInterval(interval);
  }, [appState, quests]);
  
  useEffect(() => {`;

code = code.replace(
  /  useEffect\(\(\) => \{\n    if \(appState === 'playing'\) \{/,
  regenHook + "\n    if (appState === 'playing') {"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Mana regen patched.');
