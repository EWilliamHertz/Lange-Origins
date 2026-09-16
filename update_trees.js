import fs from 'fs';
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

// I'll find the tree generation logic
// const moisture = moistureNoise.get(x * 0.02);
// const isForest = moisture > 0.2;
// const treeChance = isForest ? 0.35 : 0.05;

code = code.replace(/const isForest = moisture > 0\.2;/, "const isForest = moisture > -0.1;");
code = code.replace(/const treeChance = isForest \? 0\.35 : 0\.05;/, "const treeChance = isForest ? 0.65 : 0.15;");

fs.writeFileSync('src/lib/world.ts', code);
