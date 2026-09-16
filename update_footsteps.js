import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

// Inside loop, check if player is grounded and moving
const footstepLogic = `
      // Footsteps
      if (player.grounded && Math.abs(player.vx) > 0.5) {
         if (!state.lastFootstepTime) state.lastFootstepTime = 0;
         if (timestamp - state.lastFootstepTime > 300) {
            // Get block under player
            const px = Math.floor((player.x + player.width / 2) / TILE_SIZE);
            const py = Math.floor((player.y + player.height + 2) / TILE_SIZE);
            if (px >= 0 && px < WORLD_WIDTH && py >= 0 && py < WORLD_HEIGHT) {
               const bUnder = world[px][py];
               if (bUnder !== BlockType.Air) {
                  Sounds.footstep(bUnder);
               }
            }
            state.lastFootstepTime = timestamp;
         }
      }

      ctx.save();
`;
code = code.replace(/ctx\.save\(\);\n\s*ctx\.translate\(-Math\.floor\(state\.cameraX\)/, footstepLogic + "      ctx.translate(-Math.floor(state.cameraX)");

code = code.replace(/lastLightTime: number;/, "lastLightTime: number;\n    lastFootstepTime?: number;");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
