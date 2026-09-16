import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const oldCall = `      // Compute light map periodically or if it doesn't exist
      if (world.length > 0 && (!state.lightMap || timestamp - state.lastLightTime > 150)) {
         state.lightMap = computeLighting(world, state.timeOfDay);
         state.lastLightTime = timestamp;
      }`;
      
const newCall = `      const startCol = Math.max(0, Math.floor(state.cameraX / TILE_SIZE));
      const endCol = Math.min(WORLD_WIDTH - 1, Math.floor((state.cameraX + dimensions.width) / TILE_SIZE));
      const startRow = Math.max(0, Math.floor(state.cameraY / TILE_SIZE));
      const endRow = Math.min(WORLD_HEIGHT - 1, Math.floor((state.cameraY + dimensions.height) / TILE_SIZE));

      // Compute light map periodically or if it doesn't exist
      if (world.length > 0 && (!state.lightMap || timestamp - state.lastLightTime > 150)) {
         state.lightMap = computeLighting(world, state.timeOfDay, startCol, startRow, endCol - startCol, endRow - startRow);
         state.lastLightTime = timestamp;
      }`;
      
code = code.replace(oldCall, newCall);

// Remove the duplicate variable declarations for startCol, etc. since we moved them up.
const dupDecl = `      const startCol = Math.max(0, Math.floor(state.cameraX / TILE_SIZE));
      const endCol = Math.min(WORLD_WIDTH - 1, Math.floor((state.cameraX + dimensions.width) / TILE_SIZE));
      const startRow = Math.max(0, Math.floor(state.cameraY / TILE_SIZE));
      const endRow = Math.min(WORLD_HEIGHT - 1, Math.floor((state.cameraY + dimensions.height) / TILE_SIZE));`;

// The duplicate declaration will appear TWICE now. Let's just remove the second one.
const arr = code.split(dupDecl);
if (arr.length > 2) {
    // Rejoin the parts, leaving the first occurrence, replacing the second with nothing
    code = arr[0] + dupDecl + arr[1] + arr[2];
}

fs.writeFileSync('src/components/GameCanvas.tsx', code);
