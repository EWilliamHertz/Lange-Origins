import { BlockType, WORLD_WIDTH, WORLD_HEIGHT } from './constants';
import { Simple1DNoise } from './noise';

export type World = number[][];

function stringToSeed(str: string): number {
  let seed = 0;
  for (let i = 0; i < str.length; i++) {
    seed = Math.imul(31, seed) + str.charCodeAt(i) | 0;
  }
  return seed;
}

export function generateWorld(roomId: string = 'default'): World {
  const seedBase = stringToSeed(roomId);
  
  // Mulberry32 PRNG
  let a = seedBase;
  const random = () => {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  const world: World = [];
  const noise = new Simple1DNoise(seedBase); // Main elevation
  const noise2 = new Simple1DNoise(seedBase + 1234); // Detail
  
  const moistureNoise = new Simple1DNoise(seedBase + 8888); // Biomes
  const temperatureNoise = new Simple1DNoise(seedBase + 9999); // Temperature for Snow/Ice

  const oreNoiseCoal = new Simple1DNoise(seedBase + 111);
  const oreNoiseIron = new Simple1DNoise(seedBase + 222);
  const oreNoiseGold = new Simple1DNoise(seedBase + 333);
  const oreNoiseDiamond = new Simple1DNoise(seedBase + 444);


  if (roomId.startsWith('dungeon')) {
     const w = [];
     for (let x = 0; x < WORLD_WIDTH; x++) {
        w[x] = [];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
           w[x][y] = BlockType.AdminBrick; // Solid bedrock everywhere
        }
     }
     
     // Generate a long linear dungeon tunnel
     const tunnelLevel = Math.floor(WORLD_HEIGHT / 2);
     for (let x = 10; x < WORLD_WIDTH - 10; x++) {
         for (let y = tunnelLevel - 3; y <= tunnelLevel + 2; y++) {
             w[x][y] = BlockType.Air; // The hallway
         }
         // Floor
         w[x][tunnelLevel + 3] = BlockType.Stone;
         // Ceiling
         w[x][tunnelLevel - 4] = BlockType.Stone;
         
         // Spawners/Lights
         if (x % 20 === 0) {
             w[x][tunnelLevel - 3] = BlockType.Torch;
         }
     }
     
     // Boss Room at the end
     const bossX = WORLD_WIDTH - 30;
     for (let x = bossX - 10; x <= bossX + 10; x++) {
         for (let y = tunnelLevel - 10; y <= tunnelLevel + 2; y++) {
             w[x][y] = BlockType.Air;
         }
         w[x][tunnelLevel + 3] = BlockType.AdminBrick; // unbreakable floor
     }
     
     // Spawner for boss (will be handled by server, maybe we put a specific block for it?)
     // For now just put a chest
     w[bossX][tunnelLevel + 2] = BlockType.Chest;
     w[bossX-1][tunnelLevel + 2] = BlockType.GoldOre;
     w[bossX+1][tunnelLevel + 2] = BlockType.DiamondOre;
     
     // Exit door
     w[10][tunnelLevel + 2] = BlockType.Merchant; // Someone to buy from at start
     w[11][tunnelLevel + 2] = BlockType.QuestNPC; 
     return w;
  }
        
  const surfaceLevel = Math.floor(WORLD_HEIGHT / 2.5); // Move surface down slightly for taller mountains
  const waterLevel = surfaceLevel + 5; // Absolute sea level

  // Pre-fill with air
  for (let x = 0; x < WORLD_WIDTH; x++) {
    world[x] = [];
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      world[x][y] = BlockType.Air;
    }
  }

  // Generate terrain
  for (let x = 0; x < WORLD_WIDTH; x++) {
    // Generate height offset using multi-layered noise (low freq large amp + high freq low amp)
    let plateauLift = 0;
    if (x < 300) {
       plateauLift = (300 - x) * 0.3;
    } else if (x > WORLD_WIDTH - 300) {
       plateauLift = (x - (WORLD_WIDTH - 300)) * 0.3;
    }
    const elevation = (noise.get(x * 0.005) * 40) + (noise2.get(x * 0.02) * 15) - plateauLift;
    const localSurface = Math.floor(surfaceLevel + elevation);
    
    
    // Determine biome properties based on moisture and temperature
    const moisture = moistureNoise.get(x * 0.002); // -1 to 1 roughly
    const temperature = temperatureNoise.get(x * 0.0025); // -1 to 1
    
    const isCold = temperature < -0.2; // Snow biome
    const isDesert = moisture < -0.2 && !isCold; // Don't make it desert if it's freezing
    
    const isOcean = localSurface > waterLevel; // Terrain dips below sea level


    const dirtDepth = Math.floor(random() * 3) + (isDesert ? 5 : 3);

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      if (y < localSurface) {
        world[x][y] = BlockType.Air;
      
      } else if (y === localSurface) {
        // Surface block
        if (isOcean) {
          if (isCold && localSurface <= waterLevel + 1) {
             world[x][y] = BlockType.Ice; // Frozen ocean surface
          } else {
             world[x][y] = BlockType.Sand; // Ocean floor
          }
        } else if (localSurface >= waterLevel - 2 && localSurface <= waterLevel + 1) {
          world[x][y] = isCold ? BlockType.Snow : BlockType.Sand; // Snowy beach or normal beach
        } else if (isDesert) {
          world[x][y] = BlockType.Sand;
        } else if (isCold) {
          world[x][y] = BlockType.Snow;
        } else {
          world[x][y] = BlockType.Grass;
        }
      } else if (y > localSurface && y <= localSurface + dirtDepth) {
        // Sub-surface
        if (isOcean) {
          world[x][y] = BlockType.Sand;
        } else if (isDesert || (localSurface >= waterLevel - 2 && localSurface <= waterLevel + 1)) {
          world[x][y] = BlockType.Sand;
        } else if (isCold) {
          world[x][y] = BlockType.Dirt; // Dirt under snow
        } else {
          world[x][y] = BlockType.Dirt;
        }

      } else if (y > localSurface + dirtDepth) {
        // Deep stone
        world[x][y] = BlockType.Stone;

        // Ore Generation using noise thresholding and depth scaling
        const depth = y - (localSurface + dirtDepth); // How far into the stone we are
        
        // Coal: common, upper stone
        if (Math.abs(oreNoiseCoal.get((x + y * WORLD_WIDTH) * 0.1)) > 0.85) {
            world[x][y] = BlockType.CoalOre;
        }
        // Iron: less common, deeper
        else if (depth > 10 && Math.abs(oreNoiseIron.get((x + y * WORLD_WIDTH) * 0.12)) > 0.88) {
            world[x][y] = BlockType.IronOre;
        }
        // Gold: rare, deep
        else if (depth > 25 && Math.abs(oreNoiseGold.get((x + y * WORLD_WIDTH) * 0.15)) > 0.93) {
            world[x][y] = BlockType.GoldOre;
        }
        // Diamond: very rare, very deep
        else if (depth > 40 && Math.abs(oreNoiseDiamond.get((x + y * WORLD_WIDTH) * 0.2)) > 0.96) {
            world[x][y] = BlockType.DiamondOre;
        }
        // Blue Crystal: deep magic ore
        else if (depth > 30 && Math.abs(oreNoiseDiamond.get((x + y * WORLD_WIDTH) * 0.17)) > 0.95) {
            world[x][y] = BlockType.BlueCrystal;
        }
      }
    }
  }

  // Add trees (skip deserts and oceans)
  for (let x = 5; x < WORLD_WIDTH - 5; x++) {
    // Find the surface
    let y = 0;
    while(y < WORLD_HEIGHT && world[x][y] === BlockType.Air) y++;
    
    if (y < WORLD_HEIGHT && (world[x][y] === BlockType.Grass || world[x][y] === BlockType.Dirt)) {
      const treeChance = 0.25; // 25% chance of tree on any grass/dirt
      
      let nearbyWood = false;
      for (let dx = -2; dx <= 2; dx++) {
         if (x + dx >= 0 && x + dx < WORLD_WIDTH && y > 0 && world[x + dx][y - 1] === BlockType.Wood) {
            nearbyWood = true;
         }
      }
      
      if (random() < treeChance && !nearbyWood) {
        const treeHeight = Math.floor(random() * 3) + 4;
        
        // Trunk
        for (let i = 0; i < treeHeight; i++) {
          if (y - 1 - i >= 0) world[x][y - 1 - i] = BlockType.Wood;
        }
        
        // Leaves
        const leafCenterY = y - treeHeight;
        for (let lx = x - 2; lx <= x + 2; lx++) {
          for (let ly = leafCenterY - 2; ly <= leafCenterY + 1; ly++) {
            if (Math.abs(lx - x) + Math.abs(ly - leafCenterY) <= 2.5) {
              if (lx >= 0 && lx < WORLD_WIDTH && ly >= 0 && ly < WORLD_HEIGHT) {
                if (world[lx][ly] === BlockType.Air) {
                  world[lx][ly] = BlockType.Leaves;
                }
              }
            }
          }
        }
      }
    } else if (y < WORLD_HEIGHT && world[x][y] === BlockType.Sand) {
      // Cactus in desert
      const temperature = temperatureNoise.get(x * 0.005) * 1.5;
      const isCold = temperature < -0.1;
      
      if (!isCold && random() < 0.05 && world[x-1][y-1] !== BlockType.Cactus) {
         const cactusHeight = Math.floor(random() * 3) + 2;
         for (let i = 0; i < cactusHeight; i++) {
            if (y - 1 - i >= 0) world[x][y - 1 - i] = BlockType.Cactus;
         }
      }

    } else if (y < WORLD_HEIGHT && world[x][y] === BlockType.Snow) {
      // Ice Spikes in snow
      if (random() < 0.02 && world[x-1][y-1] !== BlockType.Ice) {
         const spikeHeight = Math.floor(random() * 5) + 3;
         for (let i = 0; i < spikeHeight; i++) {
            if (y - 1 - i >= 0) {
               world[x][y - 1 - i] = BlockType.Ice;
               // make it thick at bottom
               if (i < 2) {
                  if (x > 0 && world[x-1][y - 1 - i] === BlockType.Air) world[x-1][y - 1 - i] = BlockType.Ice;
                  if (x < WORLD_WIDTH-1 && world[x+1][y - 1 - i] === BlockType.Air) world[x+1][y - 1 - i] = BlockType.Ice;
               }
            }
         }
      }
    }
  }

  
  // --- Structure Pass ---
  for (let x = 20; x < WORLD_WIDTH - 20; x += 40 + Math.floor(random() * 60)) {
     // Find surface
     let y = 0;
     while(y < WORLD_HEIGHT && world[x][y] === BlockType.Air) y++;
     
     if (y < WORLD_HEIGHT) {
         if (world[x][y] === BlockType.Sand) {
            // Check if flat enough
            let flat = true;
            for(let dx=-5; dx<=5; dx++) {
               let sy = 0;
               while(sy < WORLD_HEIGHT && world[x+dx][sy] === BlockType.Air) sy++;
               if (Math.abs(sy - y) > 2 || world[x+dx][sy] !== BlockType.Sand) flat = false;
            }
            if (flat) {
               // Build pyramid
               for (let h = 0; h < 6; h++) {
                  for (let dx = -(5-h); dx <= (5-h); dx++) {
                     world[x+dx][y - 1 - h] = BlockType.Sand;
                     // also clear above
                     for (let cy = y - 2 - h; cy > Math.max(0, y - 10); cy--) {
                         world[x+dx][cy] = BlockType.Air;
                     }
                  }
               }
               // Hollow center and chest
               world[x][y-1] = BlockType.Air;
               world[x][y-2] = BlockType.Air;
               world[x][y-3] = BlockType.Air;
               world[x][y-1] = BlockType.Chest;
               
               x += 30;
            }
         } else if (world[x][y] === BlockType.Snow) {
            // Build snow ruins
            let flat = true;
            for(let dx=-4; dx<=4; dx++) {
               let sy = 0;
               while(sy < WORLD_HEIGHT && world[x+dx][sy] === BlockType.Air) sy++;
               if (Math.abs(sy - y) > 3 || world[x+dx][sy] !== BlockType.Snow) flat = false;
            }
            if (flat) {
               for(let dx=-4; dx<=4; dx++) {
                  if (Math.abs(dx) === 4 || Math.abs(dx) === 3) {
                     let h = Math.floor(random() * 4) + 2;
                     for(let i=0; i<h; i++) {
                        world[x+dx][y - 1 - i] = BlockType.Stone; // Stone ruins in snow
                     }
                  } else {
                     world[x+dx][y - 1] = BlockType.Stone;
                  }
               }
               world[x][y-2] = BlockType.Chest;
               world[x][y-1] = BlockType.Air;
               world[x][y-3] = BlockType.Air;
               x += 30;
            }
         }
     }
  }

  // --- Dungeon Pass ---
  for (let i = 0; i < 30; i++) {
     let dx = 10 + Math.floor(random() * (WORLD_WIDTH - 20));
     let dy = surfaceLevel + 30 + Math.floor(random() * (WORLD_HEIGHT - surfaceLevel - 40));
     
     // 7x7 room
     for (let rx = -4; rx <= 4; rx++) {
        for (let ry = -4; ry <= 4; ry++) {
           let tx = dx + rx;
           let ty = dy + ry;
           if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
              if (Math.abs(rx) === 4 || Math.abs(ry) === 4) {
                 world[tx][ty] = BlockType.AdminBrick; // Unbreakable walls, or maybe just stone? Let's use Stone or a new block. We have AdminBrick, but let's use Stone with Mossy variants if we had one. Just Stone is fine, but maybe Wood? Let's use Wood for mine shafts, AdminBrick for dungeons? AdminBrick is unbreakable. Let's use Stone for walls, but place chests inside.
                 world[tx][ty] = BlockType.Stone; 
              } else {
                 world[tx][ty] = BlockType.Air;
              }
           }
        }
     }
     // Add chest and spawners (maybe just a mob will spawn naturally, but we can put some iron/gold blocks or a chest)
     if (dx >= 0 && dx < WORLD_WIDTH && dy >= 0 && dy < WORLD_HEIGHT) {
        world[dx][dy + 3] = BlockType.Chest;
        world[dx - 2][dy + 3] = BlockType.IronOre;
        world[dx + 2][dy + 3] = BlockType.GoldOre;
     }
  }

  // Add some simple caves using simple random walk
  for (let i = 0; i < 80; i++) {
    let cx = Math.floor(random() * WORLD_WIDTH);
    let cy = surfaceLevel + 25 + Math.floor(random() * (WORLD_HEIGHT - surfaceLevel - 40));
    let length = 150 + Math.floor(random() * 300); // Longer caves
    let size = 2 + random() * 4; // Thicker caves
    
    for (let j = 0; j < length; j++) {
      // Clear area around (cx, cy)
      const isize = Math.floor(size);
      for (let dx = -isize; dx <= isize; dx++) {
        for (let dy = -isize; dy <= isize; dy++) {
           if (dx*dx + dy*dy <= size*size) {
             const tx = Math.floor(cx + dx);
             const ty = Math.floor(cy + dy);
             if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
                // Prevent caves from breaking the surface
                const localElev = (noise.get(tx * 0.005) * 40) + (noise2.get(tx * 0.02) * 15);
                if (ty > surfaceLevel + localElev + 12) {
                   world[tx][ty] = BlockType.Air;

                   // Bottom of deep caves might have lava
                   if (ty > WORLD_HEIGHT - 30 && dy === isize && random() < 0.3) {
                       world[tx][ty] = BlockType.Lava;
                   }
                   
                   // Occasionally spawn a chest or rare ore in caves
                   if (dy === isize && world[tx][ty] === BlockType.Air && world[tx][ty+1] === BlockType.Stone) {
                       if (random() < 0.01) {
                           world[tx][ty] = BlockType.Chest;
                       } else if (random() < 0.05) {
                           world[tx][ty] = BlockType.DiamondOre;
                       } else if (random() < 0.05) {
                           world[tx][ty] = BlockType.BlueCrystal;
                       } else if (random() < 0.1) {
                           world[tx][ty] = BlockType.GoldOre;
                       }
                   }
                }
             }
           }
        }
      }
      
      // Wander
      cx += (random() - 0.5) * 5;
      cy += (random() - 0.3) * 5; // Tend to go downwards slightly
      size += (random() - 0.5) * 1.2;
      if (size < 1.5) size = 1.5;
      if (size > 8) size = 8;
      
      if (cx < 0 || cx >= WORLD_WIDTH || cy < 0 || cy >= WORLD_HEIGHT) break;
    }
  }
// Generate NPC Building at Spawn Center
  const centerX = Math.floor(WORLD_WIDTH / 2);
  let centerY = 0;
  while(centerY < WORLD_HEIGHT && world[centerX][centerY] === BlockType.Air) centerY++;
  
  // Flatten a 9-wide area
  for (let dx = -4; dx <= 4; dx++) {
    for (let y = centerY - 5; y <= centerY + 2; y++) {
      if (y === centerY) {
         world[centerX + dx][y] = BlockType.AdminBrick; // floor
      } else if (y < centerY) {
         world[centerX + dx][y] = BlockType.Air; // clear space above
      }
    }
  }
  
  // Build Walls
  for (let y = centerY - 1; y >= centerY - 4; y--) {
    world[centerX - 4][y] = BlockType.AdminBrick;
    world[centerX + 4][y] = BlockType.AdminBrick;
  }
  
  // Make a door (opening) on the left and right walls
  world[centerX - 4][centerY - 1] = BlockType.Door;
  world[centerX - 4][centerY - 2] = BlockType.Door;
  world[centerX + 4][centerY - 1] = BlockType.Door;
  world[centerX + 4][centerY - 2] = BlockType.Door;

  // Build Roof
  for (let dx = -4; dx <= 4; dx++) {
    world[centerX + dx][centerY - 5] = BlockType.AdminBrick;
  }
  // Add Quest NPC
  world[centerX][centerY - 1] = BlockType.QuestNPC;
  world[centerX + 3][centerY - 1] = BlockType.DurelNPC;
  // Spawn Merchant nearby
  world[centerX - 3][centerY - 1] = BlockType.Merchant;
  // Torches
  world[centerX - 3][centerY - 3] = BlockType.Torch;
  world[centerX + 3][centerY - 3] = BlockType.Torch;

  return world;
}
