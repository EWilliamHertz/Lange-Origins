import fs from 'fs';
let code = fs.readFileSync('src/lib/lighting.ts', 'utf8');

const oldLighting = `export function computeLighting(world: World, timeOfDay: number): LightMap {
  const lightMap = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const queue: number[] = [];
  
  // Sky light level based on time of day
  // 0.2 - 0.8 is daytime (15 to 4 based on transition)
  let skyLight = 15;
  if (timeOfDay < 0.2 || timeOfDay > 0.8) skyLight = 4; // Night
  else if (timeOfDay < 0.25 || timeOfDay > 0.75) skyLight = 10; // Twilight

  // Initialize light sources (Sky and Torches)
  for (let x = 0; x < WORLD_WIDTH; x++) {
    let hitSolid = false;
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      const block = world[x][y];
      const idx = x + y * WORLD_WIDTH;
      
      if (!hitSolid) {
        lightMap[idx] = skyLight;
        queue.push(idx);
        if (SolidBlocks.has(block) && block !== BlockType.Leaves && block !== BlockType.Glass) {
          hitSolid = true;
        }
      } else if (block === BlockType.Torch || block === BlockType.Lava) {
        lightMap[idx] = 15;
        queue.push(idx);
      }
    }
  }`;

const newLighting = `export function computeLighting(world: World, timeOfDay: number, viewX?: number, viewY?: number, viewW?: number, viewH?: number): LightMap {
  const lightMap = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const queue: number[] = [];
  
  // Sky light level based on time of day
  let skyLight = 15;
  if (timeOfDay < 0.2 || timeOfDay > 0.8) skyLight = 4; // Night
  else if (timeOfDay < 0.25 || timeOfDay > 0.75) skyLight = 10; // Twilight
  
  let minX = 0;
  let maxX = WORLD_WIDTH - 1;
  let minY = 0;
  let maxY = WORLD_HEIGHT - 1;
  
  if (viewX !== undefined && viewW !== undefined) {
      minX = Math.max(0, viewX - 20);
      maxX = Math.min(WORLD_WIDTH - 1, viewX + viewW + 20);
      minY = Math.max(0, viewY - 20);
      maxY = Math.min(WORLD_HEIGHT - 1, viewY + viewH + 20);
  }

  // To properly calculate skylight, we need to know the surface for the bounded area.
  // Actually, we can just trace down from Y=0 for the columns in our bounded area
  for (let x = minX; x <= maxX; x++) {
    let hitSolid = false;
    for (let y = 0; y <= maxY; y++) {
      const block = world[x][y];
      const idx = x + y * WORLD_WIDTH;
      
      if (!hitSolid) {
        // We are still in the sky
        if (y >= minY) {
           lightMap[idx] = skyLight;
           queue.push(idx);
        }
        if (SolidBlocks.has(block) && block !== BlockType.Leaves && block !== BlockType.Glass) {
          hitSolid = true;
        }
      } else if (y >= minY && (block === BlockType.Torch || block === BlockType.Lava)) {
        lightMap[idx] = 15;
        queue.push(idx);
      }
    }
  }`;

code = code.replace(oldLighting, newLighting);

// Also update the flood fill logic to respect minX, maxX, minY, maxY
const floodOld = `    for (const {nx, ny} of neighbors) {
      if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {`;
      
const floodNew = `    for (const {nx, ny} of neighbors) {
      if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY) {`;

code = code.replace(floodOld, floodNew);

fs.writeFileSync('src/lib/lighting.ts', code);
