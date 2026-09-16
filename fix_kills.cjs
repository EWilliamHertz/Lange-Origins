const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const [health, setHealth] = useState(10);",
  "const [health, setHealth] = useState(10);\n  const [kills, setKills] = useState(0);"
);

code = code.replace(
  "quests: JSON.stringify(defaultQuests),",
  "quests: JSON.stringify(defaultQuests),\n                         kills: 0,"
);

code = code.replace(
  "if (active.health !== undefined) setHealth(active.health);",
  "if (active.health !== undefined) setHealth(active.health);\n              if (active.kills !== undefined) setKills(active.kills);"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added kills state to profile logic');
