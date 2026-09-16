const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

// add to props signature
code = code.replace(
  "skills?: { vitality: number, speed: number, strength: number };",
  "skills?: { vitality: number, speed: number, strength: number };\n  mana?: number;\n  onManaChange?: (mana: number) => void;"
);

code = code.replace(
  "skills }: GameProps)",
  "skills, mana, onManaChange }: GameProps)"
);

// add to propsRef
code = code.replace(
  "chestplate, skills });",
  "chestplate, skills, mana, onManaChange });"
);
code = code.replace(
  "chestplate, skills };\n  }, [",
  "chestplate, skills, mana, onManaChange };\n  }, ["
);
code = code.replace(
  "chestplate, skills]);",
  "chestplate, skills, mana, onManaChange]);"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Fixed GameCanvas mana integration');
