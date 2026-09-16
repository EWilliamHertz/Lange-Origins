import { BlockType, WORLD_WIDTH, WORLD_HEIGHT, SolidBlocks } from './constants';
import { World } from './world';

export type LightMap = Uint8Array;

export function computeLighting(world: World, timeOfDay: number, viewX?: number, viewY?: number, viewW?: number, viewH?: number, extraLights?: {x: number, y: number, intensity: number}[]): LightMap {
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

  if (extraLights) {
     for (const light of extraLights) {
        if (light.x >= minX && light.x <= maxX && light.y >= minY && light.y <= maxY) {
           const idx = light.x + light.y * WORLD_WIDTH;
           lightMap[idx] = Math.max(lightMap[idx], light.intensity);
           queue.push(idx);
        }
     }
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
      if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY) {
        const nIdx = nx + ny * WORLD_WIDTH;
        const nBlock = world[nx][ny];
        const isSolid = SolidBlocks.has(nBlock) && nBlock !== BlockType.Glass && nBlock !== BlockType.Leaves;
        
        // Light drops by 1 in air/glass, 3 in solid blocks
        const drop = isSolid ? 2 : 1;
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
