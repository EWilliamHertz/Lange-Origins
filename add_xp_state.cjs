const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const [mana, setMana] = useState(100);",
  "const [mana, setMana] = useState(100);\n  const [xp, setXp] = useState(0);\n  const [level, setLevel] = useState(1);\n  const [skillPoints, setSkillPoints] = useState(0);\n  const [skills, setSkills] = useState({ vitality: 0, speed: 0, strength: 0 });"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added xp state to App.tsx');
