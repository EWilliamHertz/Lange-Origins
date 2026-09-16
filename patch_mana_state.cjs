const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const [health, setHealth] = useState(10);",
  "const [health, setHealth] = useState(10);\n  const [mana, setMana] = useState(100);"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Mana state patched.');
