lines = open('src/lib/world.ts').read().split('\n')
for i in range(len(lines)):
    if "const surfaceLevel = Math.floor(WORLD_HEIGHT / 2.5);" in lines[i]:
        insert_code = """
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
        """
        lines.insert(i, insert_code)
        break
open('src/lib/world.ts', 'w').write('\n'.join(lines))
