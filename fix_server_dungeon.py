lines = open('server.ts').read().split('\n')
for i in range(len(lines)):
    if "world: generateWorld(roomId)," in lines[i] and "players: {}," in lines[i+1]:
        insert_code = """
          world: generateWorld(roomId),
          players: {},
          mobs: (() => {
             const m: any = {};
             if (roomId.startsWith('dungeon')) {
                 const tunnelLevel = 250 / 2; // WORLD_HEIGHT is 250
                 for (let x = 30; x < 970; x += 50) { // WORLD_WIDTH is 1000, up to 970
                     const id = 'mob_' + Date.now() + '_' + x;
                     m[id] = { id, type: 'skeleton', x: x * 32, y: tunnelLevel * 32, vx: 0, vy: 0, hp: 50, maxHp: 50 };
                     
                     const id2 = 'mob_z_' + Date.now() + '_' + x;
                     m[id2] = { id: id2, type: 'zombie', x: (x + 20) * 32, y: tunnelLevel * 32, vx: 0, vy: 0, hp: 80, maxHp: 80 };
                 }
                 const bossId = 'boss_' + Date.now();
                 m[bossId] = { id: bossId, type: 'golem_boss', x: 970 * 32, y: tunnelLevel * 32, vx: 0, vy: 0, hp: 1000, maxHp: 1000 };
             }
             return m;
          })(),
        """
        del lines[i:i+3]
        lines.insert(i, insert_code)
        break

open('server.ts', 'w').write('\n'.join(lines))
