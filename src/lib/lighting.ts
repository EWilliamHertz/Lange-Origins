import { BlockType, WORLD_WIDTH, WORLD_HEIGHT, SolidBlocks } from './constants';
import { World } from './world';

export type LightMap = Uint8Array;

export function computeLighting(world: World, timeOfDay: number): LightMap {
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
  }

  // Flood fill
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % WORLD_WIDTH;
    const y = Math.floor(idx / WORLD_WIDTH);
    const light = lightMap[idx];
    
    if (light <= 1) continue;

    // Neighbors
    const neighbors = [
      {nx: x - 1, ny: y},
      {nx: x + 1, ny: y},
      {nx: x, ny: y - 1},
      {nx: x, ny: y + 1}
    ];

    for (const {nx, ny} of neighbors) {
      if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
        const nIdx = nx + ny * WORLD_WIDTH;
        const nBlock = world[nx][ny];
        const isSolid = SolidBlocks.has(nBlock) && nBlock !== BlockType.Glass && nBlock !== BlockType.Leaves;
        
        // Light drops by 1 in air/glass, 3 in solid blocks
        const drop = isSolid ? 3 : 1;
        const newLight = light - drop;
        
        if (newLight > lightMap[nIdx]) {
          lightMap[nIdx] = newLight;
          queue.push(nIdx);
        }
      }
    }
  }

  return lightMap;
}
