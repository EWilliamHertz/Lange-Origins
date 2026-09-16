const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "return () => clearInterval(interval);\n  }, [appState, quests]);",
  "return () => clearInterval(interval);\n  }, [appState, quests, skills.strength]);"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed max mana regen deps');
