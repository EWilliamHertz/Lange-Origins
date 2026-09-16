const fs = require('fs');

let constants = fs.readFileSync('src/lib/constants.ts', 'utf8');
constants = constants.replace("export const WORLD_WIDTH = 512;", "export const WORLD_WIDTH = 1024;");
constants = constants.replace("export const WORLD_HEIGHT = 200;", "export const WORLD_HEIGHT = 400;");
fs.writeFileSync('src/lib/constants.ts', constants);

let worldCode = fs.readFileSync('src/lib/world.ts', 'utf8');
worldCode = worldCode.replace(/let height = Math\.floor\(WORLD_HEIGHT \* 0\.3\);/, "let height = Math.floor(WORLD_HEIGHT * 0.4);"); // Make base height lower (larger Y)
worldCode = worldCode.replace(/for \(let x = 0; x < WORLD_WIDTH; x\+\+\) \{/, `
    // Pre-calculate heights for plateaus
    const heights = [];
    let currentHeight = Math.floor(WORLD_HEIGHT * 0.4);
    for (let x = 0; x < WORLD_WIDTH; x++) {
        if (x < 150) {
            // Left plateau
            const distFromEdge = x;
            currentHeight = Math.floor(WORLD_HEIGHT * 0.1) + Math.floor(distFromEdge * 0.5) + Math.floor(Math.random() * 3) - 1;
            if (currentHeight > Math.floor(WORLD_HEIGHT * 0.4)) currentHeight = Math.floor(WORLD_HEIGHT * 0.4);
        } else if (x > WORLD_WIDTH - 150) {
            // Right plateau
            const distFromEdge = WORLD_WIDTH - x;
            currentHeight = Math.floor(WORLD_HEIGHT * 0.1) + Math.floor(distFromEdge * 0.5) + Math.floor(Math.random() * 3) - 1;
            if (currentHeight > Math.floor(WORLD_HEIGHT * 0.4)) currentHeight = Math.floor(WORLD_HEIGHT * 0.4);
        } else {
            currentHeight += Math.floor(Math.random() * 3) - 1;
            if (currentHeight < Math.floor(WORLD_HEIGHT * 0.25)) currentHeight = Math.floor(WORLD_HEIGHT * 0.25);
            if (currentHeight > Math.floor(WORLD_HEIGHT * 0.5)) currentHeight = Math.floor(WORLD_HEIGHT * 0.5);
        }
        heights.push(currentHeight);
    }

    for (let x = 0; x < WORLD_WIDTH; x++) {
        let height = heights[x]; // Override previous logic entirely inside the loop? Wait, we can just replace the height logic inside the loop!
`);

fs.writeFileSync('patch_map.cjs', fs.readFileSync('patch_map.cjs', 'utf8'));
