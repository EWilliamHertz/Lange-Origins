import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const redstoneLogic = `
      // Check Redstone/Pressure Plates for players
      for (const pId in room.players) {
          const p = room.players[pId];
          const px = Math.floor((p.x + 12) / 32);
          const py = Math.floor((p.y + 12) / 32);
          if (room.world[px] && room.world[px][py] === 32) { // PressurePlate = 32
              // Open nearby doors
              for(let dx=-2; dx<=2; dx++){
                 for(let dy=-2; dy<=2; dy++){
                    if(room.world[px+dx] && room.world[px+dx][py+dy] === 29) { // Door = 29
                        room.world[px+dx][py+dy] = 33; // DoorOpen = 33
                        io.to(roomId).emit('world_updated', { tx: px+dx, ty: py+dy, blockType: 33 });
                    }
                 }
              }
          }
      }
`;

code = code.replace(/\/\/ Update items/, redstoneLogic + "\n      // Update items");

fs.writeFileSync('server.ts', code);
