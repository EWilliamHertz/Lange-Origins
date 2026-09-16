const fs = require('fs');

let noiseCode = fs.readFileSync('src/lib/noise.ts', 'utf8');
noiseCode = noiseCode.replace("this.vertices.push(random());", "this.vertices.push(random() * 2 - 1);");
fs.writeFileSync('src/lib/noise.ts', noiseCode);

let worldCode = fs.readFileSync('src/lib/world.ts', 'utf8');
worldCode = worldCode.replace("const isCold = temperature < -0.3;", "const isCold = temperature < -0.2;");
worldCode = worldCode.replace("const isDesert = moisture < -0.3", "const isDesert = moisture < -0.2");
fs.writeFileSync('src/lib/world.ts', worldCode);
console.log("Noise fixed.");
