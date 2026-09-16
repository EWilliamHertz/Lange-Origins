import fs from 'fs';
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

// Smoother elevation
code = code.replace(/const elevation = \(noise\.get\(x \* 0\.01\) \* 30\) \+ \(noise2\.get\(x \* 0\.05\) \* 10\);/, 
`const elevation = (noise.get(x * 0.005) * 40) + (noise2.get(x * 0.02) * 15);`);

// Protect surface from caves
code = code.replace(/world\[tx\]\[ty\] = BlockType\.Air;/, 
`// Prevent caves from breaking the surface
                if (ty > surfaceLevel + Math.max(elevation, -10) + 5) {
                   world[tx][ty] = BlockType.Air;
                }`);

// Better trees (denser in forests)
code = code.replace(/if \(random\(\) < 0\.1 && world\[x-1\]\[y-1\] !== BlockType\.Wood && world\[x-2\]\[y-1\] !== BlockType\.Wood\) \{/, 
`const isForest = moisture > 0.2;
      const treeChance = isForest ? 0.35 : 0.05;
      if (random() < treeChance && world[x-1][y-1] !== BlockType.Wood && world[x-2][y-1] !== BlockType.Wood) {`);

// Also need to compute elevation again inside the cave generator, or just approximate localSurface
code = code.replace(/if \(ty > surfaceLevel \+ Math\.max\(elevation, -10\) \+ 5\) \{/, 
`const localElev = (noise.get(tx * 0.005) * 40) + (noise2.get(tx * 0.02) * 15);
                if (ty > surfaceLevel + localElev + 6) {`);

fs.writeFileSync('src/lib/world.ts', code);
