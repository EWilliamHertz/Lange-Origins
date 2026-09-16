import fs from 'fs';
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

code = code.replace(/const isForest = moisture > 0\.2;/, 
`const moisture = moistureNoise.get(x * 0.02);
      const isForest = moisture > 0.2;`);

fs.writeFileSync('src/lib/world.ts', code);
