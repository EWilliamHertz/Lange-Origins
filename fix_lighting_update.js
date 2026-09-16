import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

// Update lighting interval
code = code.replace(/timestamp - state\.lastLightTime > 500/, "timestamp - state.lastLightTime > 150");

// Also let's add a soft glow to the torch block directly
const torchGlow = `
               if (block === BlockType.Torch) {
                   const cx = x * TILE_SIZE + TILE_SIZE / 2;
                   const cy = y * TILE_SIZE + TILE_SIZE / 2;
                   const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, TILE_SIZE * 3);
                   grad.addColorStop(0, 'rgba(255, 200, 50, 0.4)');
                   grad.addColorStop(1, 'rgba(255, 200, 50, 0)');
                   ctx.fillStyle = grad;
                   ctx.fillRect(cx - TILE_SIZE * 3, cy - TILE_SIZE * 3, TILE_SIZE * 6, TILE_SIZE * 6);
               }
             }
             // Apply darkness overlay
`;
code = code.replace(/\}\n\s*\/\/\s*Apply darkness overlay/, torchGlow);

fs.writeFileSync('src/components/GameCanvas.tsx', code);

let codeLight = fs.readFileSync('src/lib/lighting.ts', 'utf8');
codeLight = codeLight.replace(/const drop = isSolid \? 3 : 1;/, "const drop = isSolid ? 2 : 1;");
fs.writeFileSync('src/lib/lighting.ts', codeLight);
