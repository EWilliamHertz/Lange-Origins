import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import { generateWorld, World } from './src/lib/world';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp({
    credential: applicationDefault(),
});
const db = getFirestore("ai-studio-langeorigins-54731c1b-d12d-444f-a752-9f96409d3384");


async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: '*' }
  });

  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/servers/:id/reset', async (req, res) => {
    const roomId = req.params.id;
    if (activeRooms[roomId]) {
      // Regenerate the world
      activeRooms[roomId].world = generateWorld(roomId);
      activeRooms[roomId].mobs = {};
      activeRooms[roomId].items = {};
      activeRooms[roomId].chests = {};
      
      // Delete all saved chests for this room in Firestore
      try {
        const chestsRef = db.collection('rooms').doc(roomId).collection('chests');
        const snapshot = await chestsRef.get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } catch (e) {
        console.error("Failed to delete room chests in firestore:", e);
      }
      
      io.to(roomId).emit('chat_message', { sender: 'System', text: 'The world has been reset by an admin!' });
      io.to(roomId).emit('world_wiped', { world: activeRooms[roomId].world });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Room not found or not active.' });
    }
  });

  app.get('/api/servers', (req, res) => {
    const servers = [];
    for (const roomId in activeRooms) {
      const room = activeRooms[roomId];
      const playerCount = Object.keys(room.players).length;
      if (playerCount > 0 || roomId === 'public-lobby' || roomId.startsWith('Public')) {
        servers.push({ id: roomId, players: playerCount });
      }
    }
    res.json({ servers });
  });

  // --- Admin Endpoints ---
  app.post('/api/admin/wipe', async (req, res) => {
    const { email, roomId } = req.body;
    if (email !== 'ewilliamhe@gmail.com' && email !== 'zudran@gmail.com') return res.status(403).json({error: "Unauthorized"});
    
    const targetRoom = roomId || 'public-lobby';
    if (activeRooms[targetRoom]) {
      activeRooms[targetRoom].world = generateWorld(targetRoom);
      activeRooms[targetRoom].chests = {};
      activeRooms[targetRoom].items = {};
      activeRooms[targetRoom].mobs = {};
      
      try {
        const chestsRef = db.collection('rooms').doc(targetRoom).collection('chests');
        const snapshot = await chestsRef.get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } catch (e) {
        console.error("Failed to delete room chests in firestore:", e);
      }
      
      io.to(targetRoom).emit('world_wiped', { world: activeRooms[targetRoom].world });
      io.to(targetRoom).emit('chat_message', { sender: 'System', message: 'The world has been reset by an admin!' });
      res.json({ success: true });
    } else {
      res.status(404).json({error: "Room not found"});
    }
  });

  app.post('/api/admin/players', (req, res) => {
    const { email } = req.body;
    if (email !== 'ewilliamhe@gmail.com' && email !== 'zudran@gmail.com') return res.status(403).json({error: "Unauthorized"});
    
    const allPlayers = [];
    for (const roomId in activeRooms) {
       for (const pId in activeRooms[roomId].players) {
          allPlayers.push({ roomId, id: pId });
       }
    }
    res.json({ players: allPlayers });
  });

  app.post('/api/admin/kick', (req, res) => {
    const { email, playerId, roomId } = req.body;
    if (email !== 'ewilliamhe@gmail.com' && email !== 'zudran@gmail.com') return res.status(403).json({error: "Unauthorized"});
    
    io.to(playerId).emit('kicked', { reason: "Admin kick" });
    // The disconnect event will handle the rest, but we can forcefully disconnect the socket
    const socket = io.sockets.sockets.get(playerId);
    if (socket) {
       socket.disconnect();
    }
    res.json({ success: true, message: `Player ${playerId} kicked.` });
  });

  // --- Multiplayer Game State ---
  // Store worlds by room ID
  
function triggerExplosion(room: any, roomId: string, cx: number, cy: number, radius: number, damage: number) {
    let worldUpdated = false;
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (dx * dx + dy * dy <= radius * radius) {
                const tx = cx + dx;
                const ty = cy + dy;
                if (room.world[tx] && room.world[tx][ty] !== undefined && room.world[tx][ty] !== 0 && room.world[tx][ty] !== 21) {
                    // 21 is AdminBrick
                    const blockType = room.world[tx][ty];
                    room.world[tx][ty] = 0; // Air
                    worldUpdated = true;
                    // Send to client
                    io.to(roomId).emit('world_updated', { tx, ty, blockType: 0 });
                    
                    // Spawn dropped item
                    const id = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
                    room.items[id] = {
                        id,
                        type: blockType,
                        x: tx * 32 + 16 + (Math.random() - 0.5) * 16,
                        y: ty * 32 + 16 + (Math.random() - 0.5) * 16,
                        vx: (Math.random() - 0.5) * 8,
                        vy: -4 - Math.random() * 4
                    };

                    // Chain reaction for TNT
                    if (blockType === 34) {
                        setTimeout(() => triggerExplosion(room, roomId, tx, ty, 4, 30), 200);
                    }
                }
            }
        }
    }
    
    // Damage mobs
    const expPx = cx * 32 + 16;
    const expPy = cy * 32 + 16;
    const pxRadius = radius * 32;
    for (const mId in room.mobs) {
        const m = room.mobs[mId];
        const dist = Math.sqrt(Math.pow(m.x + 16 - expPx, 2) + Math.pow(m.y + 16 - expPy, 2));
        if (dist <= pxRadius) {
            m.hp -= damage;
            m.vy = -10;
            m.vx = m.x > expPx ? 10 : -10;
        }
    }
    
    // Damage players
    for (const pId in room.players) {
        const p = room.players[pId];
        const dist = Math.sqrt(Math.pow(p.x + 16 - expPx, 2) + Math.pow(p.y + 16 - expPy, 2));
        if (dist <= pxRadius) {
            // we could emit damage event to player
            io.to(pId).emit('damage_indicator', { id: Math.random().toString(), x: p.x, y: p.y, damage, isPlayer: false });
            io.to(pId).emit('take_damage', { damage, vx: p.x > expPx ? 15 : -15, vy: -10 });
        }
    }
}

  const activeRooms: Record<string, {
    world: World;
    players: Record<string, any>;
    mobs: Record<string, any>;
    items: Record<string, any>;
    chests: Record<string, any[]>;
    createdAt: number;
    parties: Record<string, any>;
    trades: Record<string, any>;
    projectiles: Record<string, any>;
    timeOfDay: number;
  }> = {
    'public-lobby': {
      world: generateWorld('public-lobby'),
      players: {},
      mobs: {},
      items: {},
      chests: {},
      createdAt: Date.now(),
      parties: {},
      trades: {},
      projectiles: {},
      timeOfDay: 0
    }
  };

  setInterval(() => {
    for (const roomId in activeRooms) {
      const room = activeRooms[roomId];
      let mobsUpdated = false;
      let itemsUpdated = false;
      
      
      // Projectiles
      for (const pId in room.projectiles) {
         const p = room.projectiles[pId];
         p.x += p.vx;
         p.y += p.vy;
         
         if (p.type === 'grenade') p.vy += 0.5; // gravity for grenade
         else if (p.type !== 'fireball' && p.type !== 'trap' && p.type !== 'frostbolt' && p.type !== 'arcane_blast') p.vy += 0.1;
         
         p.life--;
         
         const tx = Math.floor((p.x + (p.type === 'grenade' ? 8 : 4)) / 32);
         const ty = Math.floor((p.y + (p.type === 'grenade' ? 8 : 4)) / 32);
         
         // Collision with blocks
         if (room.world[tx] && room.world[tx][ty] && room.world[tx][ty] !== 0 && room.world[tx][ty] !== 31 && room.world[tx][ty] !== 32) {
             if (p.type === 'grenade' || p.type === 'rocket') {
                 triggerExplosion(room, roomId, tx, ty, 3, 20);
             }
             delete room.projectiles[pId];
             continue;
         }
         
         // Collision with mobs
         let hitMob = false;
         for (const mId in room.mobs) {
             const m = room.mobs[mId];
             if (p.x >= m.x - 10 && p.x <= m.x + 32 && p.y >= m.y - 10 && p.y <= m.y + 32) {
                 if (p.type === 'grenade') {
                     triggerExplosion(room, roomId, tx, ty, 3, 20);
                 } else {
                     m.hp -= p.damage || 5;
                     m.vy = -5;
                     m.vx = p.vx > 0 ? 5 : -5;
                 }
                 hitMob = true;
                 break;
             }
         }
         
         if (hitMob || p.life <= 0) {
             if (p.life <= 0 && p.type === 'grenade') {
                 triggerExplosion(room, roomId, tx, ty, 3, 20);
             }
             delete room.projectiles[pId];
         }
      }

      // Redstone & Logic
      const powered = new Set<string>();
      const toCheck: {x: number, y: number}[] = [];
      
      // Find pressure plates being stepped on
      for (const pId in room.players) {
          const p = room.players[pId];
          const px = Math.floor((p.x + 12) / 32);
          const py = Math.floor((p.y + 12) / 32);
          const py2 = Math.floor((p.y + 32) / 32);
          
          if (room.world[px]) {
              if (room.world[px][py] === 32) {
                  const key = px + ',' + py;
                  if (!powered.has(key)) { powered.add(key); toCheck.push({x: px, y: py}); }
              }
              if (room.world[px][py2] === 32) {
                  const key = px + ',' + py2;
                  if (!powered.has(key)) { powered.add(key); toCheck.push({x: px, y: py2}); }
              }
          }
      }
      
      // BFS for wire
      let iters = 0;
      while (toCheck.length > 0 && iters < 1000) {
          iters++;
          const curr = toCheck.shift()!;
          const neighbors = [
              {x: curr.x+1, y: curr.y}, {x: curr.x-1, y: curr.y},
              {x: curr.x, y: curr.y+1}, {x: curr.x, y: curr.y-1}
          ];
          for (const n of neighbors) {
              const key = n.x + ',' + n.y;
              if (!powered.has(key) && room.world[n.x]) {
                  const block = room.world[n.x][n.y];
                  if (block === 31 || block === 29 || block === 33 || block === 34) { // Wire, Door, DoorOpen, TNT
                      powered.add(key);
                      if (block === 31) toCheck.push({x: n.x, y: n.y}); // only propagate through wire
                      
                      if (block === 29) {
                          room.world[n.x][n.y] = 33;
                          io.to(roomId).emit('world_updated', { tx: n.x, ty: n.y, blockType: 33 });
                      } else if (block === 34) {
                          // Ignite TNT
                          triggerExplosion(room, roomId, n.x, n.y, 4, 30);
                      }
                  }
              }
          }
      }
      
      // Broadcast projectiles
      io.to(roomId).emit('projectiles_update', room.projectiles);

      // Update items
      for (const itemId in room.items) {
        const item = room.items[itemId];
        item.vy += 1; // gravity
        item.y += item.vy;
        item.x += item.vx;
        item.vx *= 0.9; // friction
        
        const tx = Math.floor((item.x + 8) / 32);
        const ty = Math.floor((item.y + 16) / 32);
        
        
        if (room.world[tx] && room.world[tx][ty] && room.world[tx][ty] !== 0) {
          // Bounce slightly if falling fast
          if (item.vy > 2) {
             item.vy = -item.vy * 0.4;
             item.y = ty * 32 - 16 - 0.01;
          } else {
             item.vy = 0;
             item.vx = 0;
             item.y = ty * 32 - 16 - 0.01;
          }
        }

        itemsUpdated = true;
      }
      
      if (itemsUpdated) {
        io.to(roomId).emit('items_update', room.items);
      }

      // Update mobs
      for (const mobId in room.mobs) {
        const mob = room.mobs[mobId];
        
        if (mob.hp <= 0) {
          // Drop items based on mob type
          let dropType = 0;
          let dropAmount = 1;
          if (mob.type === 'slime') {
              dropType = Math.random() > 0.5 ? 1 : 10; // Dirt or Sand (slime gel placeholder)
              dropAmount = Math.floor(Math.random() * 2) + 1;
          } else if (mob.type === 'skeleton') {
              dropType = Math.random() > 0.5 ? 403 : 107; // 403 = Bone, 107 = Arrow
              dropAmount = Math.floor(Math.random() * 3) + 1;
          } else if (mob.type === 'creeper') {
              dropType = 402; // Gunpowder
              dropAmount = Math.floor(Math.random() * 2) + 1;
          } else if (mob.type === 'zombie') {
              dropType = 1; // Dirt (placeholder for rotten flesh)
          } else if (mob.type === 'golem_boss') {
              dropType = 405; // Boss Relic
              dropAmount = 1;
              io.to(roomId).emit('chat_message', { sender: 'DUREL', text: 'THE CHAMPION HAS SLAIN A MIGHTY BOSS!!!' });
          }

          io.to(roomId).emit('mob_killed', { mobId: mob.id, type: mob.type, killerId: mob.lastHitBy });
          if (dropType !== 0) {
              for(let i = 0; i < dropAmount; i++) {
                 const id = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
                 room.items[id] = { 
                     id, 
                     type: dropType, 
                     x: mob.x + Math.random() * 16 - 8, 
                     y: mob.y + Math.random() * 16 - 8, 
                     vx: (Math.random() - 0.5) * 4, 
                     vy: -3 - Math.random() * 3,
                     spawnTime: Date.now()
                 };
                 itemsUpdated = true;
              }
          }
          
          // Spawn XP Orbs
          const xpOrbCount = mob.type === 'golem_boss' ? 20 : mob.type === 'skeleton' ? 3 : 2;
          for(let i = 0; i < xpOrbCount; i++) {
             const id = 'xp_' + Date.now() + '_' + i + '_' + Math.floor(Math.random() * 10000);
             room.items[id] = { 
                 id, 
                 type: 999,
                 x: mob.x + Math.random() * 24 - 12, 
                 y: mob.y, 
                 vx: (Math.random() - 0.5) * 5, 
                 vy: -4 - Math.random() * 3,
                 spawnTime: Date.now()
             };
             itemsUpdated = true;
          }
          
          delete room.mobs[mobId];
          mobsUpdated = true;
          // Emit items immediately so drops appear this tick, not next tick
          io.to(roomId).emit('items_update', room.items);
          continue;
        }


// Normal AI Movement or Knockback
        if (mob.ownerId) {
            // Pet AI
            const owner = room.players[mob.ownerId];
            if (owner) {
                const distToOwner = Math.sqrt(Math.pow(mob.x - owner.x, 2) + Math.pow(mob.y - owner.y, 2));
                
                // Find nearest hostile mob
                let targetMob = null;
                let closestDist = 200; // Attack range
                for (const tmId in room.mobs) {
                    const tm = room.mobs[tmId];
                    if (tmId !== mobId && !tm.ownerId) {
                        const dist = Math.sqrt(Math.pow(mob.x - tm.x, 2) + Math.pow(mob.y - tm.y, 2));
                        if (dist < closestDist) {
                            closestDist = dist;
                            targetMob = tm;
                        }
                    }
                }

                if (targetMob) {
                    // Attack target
                    if (closestDist < 40) {
                       targetMob.hp -= 2;
                       targetMob.vx = mob.x < targetMob.x ? 5 : -5;
                       targetMob.vy = -3;
                       mob.vx = mob.x < targetMob.x ? 1 : -1;
                    } else {
                       mob.vx = mob.x < targetMob.x ? 4 : -4;
                    }
                    mob.facingRight = mob.vx > 0;
                } else if (distToOwner > 60) {
                    // Follow owner
                    mob.vx = mob.x < owner.x ? 4 : -4;
                    mob.facingRight = mob.vx > 0;
                } else {
                    mob.vx *= 0.5;
                }
            } else {
               mob.vx = 0; // owner offline
            }
        } else if (Math.abs(mob.vx) > 3) {
          mob.vx *= 0.8; // friction if knocked back
        } else {
          mob.vx = mob.facingRight ? 2 : -2;
        }
        
        mob.x += mob.vx;
        mob.vy += 1; // gravity
        mob.y += mob.vy;
        
        // Very crude collision for server
        const botTy = Math.floor((mob.y + 24) / 32);
        const tx = Math.floor((mob.x + 12) / 32);
        
        if (room.world[tx] && room.world[tx][botTy] && room.world[tx][botTy] !== 0) {
           mob.vy = 0;
           mob.y = botTy * 32 - 24 - 0.01;
           
           // Jump randomly or turn around (if normal movement)
           if (Math.abs(mob.vx) <= 3) {
             if (Math.random() < 0.02) {
               mob.vy = -8;
             } else if (Math.random() < 0.01) {
               mob.facingRight = !mob.facingRight;
             }
           }
        }
        
        // Hit wall -> turn around
        if (Math.abs(mob.vx) <= 3) {
          const sideTx = Math.floor((mob.x + (mob.facingRight ? 24 : 0)) / 32);
          const midTy = Math.floor((mob.y + 12) / 32);
          if (room.world[sideTx] && room.world[sideTx][midTy] && room.world[sideTx][midTy] !== 0) {
             mob.facingRight = !mob.facingRight;
             mob.vy = -8; // jump over
          }
        }
        
        mobsUpdated = true;
      }
      
      // Spawn new mobs occasionally
      if (Object.keys(room.mobs).length < 15 && Math.random() < 0.20) {
        let spawnX = Math.floor(room.world.length / 2) + Math.floor((Math.random() - 0.5) * 40);
        let spawnY = 0;
        
        // 5% chance to try spawning a boss in the deep underground
        const isBossSpawn = Math.random() < 0.15;
        let type = 'slime';
        
        if (isBossSpawn) {
           spawnX = Math.floor(Math.random() * room.world.length);
           spawnY = room.world[0].length - Math.floor(Math.random() * 40) - 10; // Deep underground
           type = 'golem_boss';
        } else {
           while (spawnY < room.world[0].length && room.world[spawnX][spawnY] === 0) {
             spawnY++;
           }
           const elapsedMs = Date.now() - room.createdAt;
           const timeOfDay = (0.35 + elapsedMs * 0.000005) % 1.0;
           const isNight = timeOfDay < 0.1 || timeOfDay > 0.9;
           const typesNight = ['skeleton', 'creeper', 'zombie'];
           type = isNight ? typesNight[Math.floor(Math.random() * typesNight.length)] : 'slime';
        }
        
        const mobId = 'mob_' + Date.now() + Math.floor(Math.random()*1000);
        room.mobs[mobId] = {
          id: mobId,
          type: type,
          x: spawnX * 32,
          y: (spawnY - (type === 'golem_boss' ? 4 : 2)) * 32,
          vx: 0, vy: 0, 
          hp: type === 'golem_boss' ? 300 : 10, 
          maxHp: type === 'golem_boss' ? 300 : 10,
          facingRight: Math.random() > 0.5
        };
        mobsUpdated = true;
      }

      if (mobsUpdated) {
        io.to(roomId).emit('mobs_update', room.mobs);
      }
    }
  }, 50);

  io.on('connection', (socket) => {
    let currentRoom: string | null = null;

    socket.on('join_room', (data: { roomId: string, nickname?: string, uid?: string, email?: string, profileId?: string } | string) => { 
      const roomId = typeof data === 'string' ? data : data.roomId; 
      const nickname = typeof data === 'string' ? 'Player' : (data.nickname || 'Player');
      const uid = typeof data === 'string' ? undefined : data.uid;
      const email = typeof data === 'string' ? '' : (data.email || '');
      const profileId = typeof data === 'string' ? undefined : data.profileId;
      const isAdmin = email.toLowerCase() === 'ewilliamhe@gmail.com' || email.toLowerCase() === 'zudran@gmail.com';
      console.log(`Player joining: nickname=${nickname}, email="${email}", isAdmin=${isAdmin}`);
      // Leave previous room if any
      if (currentRoom) {
        socket.leave(currentRoom);
        if (activeRooms[currentRoom]) {
          delete activeRooms[currentRoom].players[socket.id];
          io.to(currentRoom).emit('player_left', socket.id);
        }
      }

      socket.join(roomId);
      currentRoom = roomId;

      // Initialize room if it doesn't exist
      if (!activeRooms[roomId]) {
        activeRooms[roomId] = {

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
        
          items: {},
          chests: {},
          createdAt: Date.now(),
          parties: {},
          trades: {},
          projectiles: {},
          timeOfDay: 0
        };
      }

      const roomCreatedAt = (activeRooms[roomId] as any).createdAt;

      // Calculate reliable spawn
      const world = activeRooms[roomId].world;
      // We also use a seeded random for the spawn point so they spawn near each other
      const spawnSeed = roomId.length + 42;
      const spawnX = Math.floor(world.length / 2) + (spawnSeed % 10 - 5);
      let spawnY = 0;
      while (spawnY < world[0].length && world[spawnX][spawnY] === 0) {
        spawnY++;
      }
      const startX = spawnX * 32;
      const startY = (spawnY - 2) * 32;

      // Add player to room
      activeRooms[roomId].players[socket.id] = { id: socket.id, name: nickname, x: startX, y: startY, facingRight: true, vx: 0, vy: 0, uid, profileId, isAdmin };

      // Send the entire current world and player list to the new user
      socket.emit('init_world', {
        world: activeRooms[roomId].world,
        players: activeRooms[roomId].players,
        mobs: activeRooms[roomId].mobs,
        items: activeRooms[roomId].items,
        id: socket.id,
        roomCreatedAt: roomCreatedAt
      });
      
      // Tell others in the room about the new player
      socket.to(roomId).emit('player_joined', activeRooms[roomId].players[socket.id]);
    });

socket.on('open_chest', async (data: { tx: number, ty: number }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const chestKey = `${data.tx}_${data.ty}`;
      if (!activeRooms[currentRoom].chests[chestKey]) {
        try {
          const chestDoc = await db.collection('rooms').doc(currentRoom).collection('chests').doc(chestKey).get();
          if (chestDoc.exists) {
            activeRooms[currentRoom].chests[chestKey] = JSON.parse(chestDoc.data()?.inventory || "[]");
          } else {
            // Generate random loot for wild chest
            const inv = Array(27).fill(null);
            const numItems = Math.floor(Math.random() * 5) + 2; // 2 to 6 items
            const possibleLoot = [202, 304, 303, 18, 19, 20]; // Apple, Grenade, Bullet, Coal, Iron, Diamond
            for (let i = 0; i < numItems; i++) {
                const idx = Math.floor(Math.random() * 27);
                const type = possibleLoot[Math.floor(Math.random() * possibleLoot.length)];
                const count = Math.floor(Math.random() * 5) + 1;
                inv[idx] = { type, count };
            }
            activeRooms[currentRoom].chests[chestKey] = inv;
            // Save initial generated chest
            db.collection('rooms').doc(currentRoom).collection('chests').doc(chestKey).set({
                inventory: JSON.stringify(inv),
                updatedAt: Date.now()
            }).catch(console.error);
          }
        } catch (e) {
          activeRooms[currentRoom].chests[chestKey] = Array(27).fill(null);
        }
      }
      socket.emit('chest_data', { tx: data.tx, ty: data.ty, inventory: activeRooms[currentRoom].chests[chestKey] });
    });

    socket.on('update_chest', (data: { tx: number, ty: number, inventory: any[] }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const chestKey = `${data.tx}_${data.ty}`;
      activeRooms[currentRoom].chests[chestKey] = data.inventory;
      socket.to(currentRoom).emit('chest_updated', { tx: data.tx, ty: data.ty, inventory: data.inventory });
      db.collection('rooms').doc(currentRoom).collection('chests').doc(chestKey).set({
        inventory: JSON.stringify(data.inventory),
        updatedAt: Date.now()
      }).catch(console.error);
    });

    socket.on('spawn_item', (data: { type: number, x: number, y: number, vx?: number, vy?: number }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const id = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      activeRooms[currentRoom].items[id] = { id, type: data.type, x: data.x, y: data.y, vx: data.vx || 0, vy: data.vy || 0 };
    });

    socket.on('collect_item', (id: string) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const room = activeRooms[currentRoom];
      if (room.items[id]) {
        const type = room.items[id].type;
        delete room.items[id];
        io.to(currentRoom).emit('item_collected', { id, type, playerId: socket.id });
      }
    });

    
    
socket.on('chat_message', (message: string) => {
      if (!currentRoom) return;
      const room = activeRooms[currentRoom];
      const player = room?.players[socket.id];
      if (!player) return;

      // ---- Admin-only commands ----
      if (message.startsWith('/give ') || message.startsWith('/give_sp ') || message.startsWith('/give_xp ') || message.startsWith('/give_level ') || message.startsWith('/mob ')) {
        if (!player.isAdmin) {
          socket.emit('chat_message', { id: 'system', name: 'System', message: '⛔ You do not have permission to use this command.' });
          return;
        }

        const parts = message.split(' ');

        if (message.startsWith('/give ')) {
          const typeId = parseInt(parts[1]);
          const count = parts[2] ? parseInt(parts[2]) : 1;
          if (!isNaN(typeId)) {
            const itemId = 'item_' + Date.now() + '_' + Math.floor(Math.random()*1000);
            room.items[itemId] = { id: itemId, type: typeId, count, x: player.x, y: player.y - 32, vx: 0, vy: -3, spawnTime: Date.now() };
            socket.emit('chat_message', { id: 'system', name: 'System', message: `✅ Spawned item ${typeId} x${count}.` });
          }
        } else if (message.startsWith('/give_sp ')) {
          const amount = parseInt(parts[1]) || 1;
          socket.emit('give_sp', amount);
          socket.emit('chat_message', { id: 'system', name: 'System', message: `✅ Granted ${amount} Skill Points.` });
        } else if (message.startsWith('/give_xp ')) {
          const amount = parseInt(parts[1]) || 100;
          socket.emit('give_xp', amount);
          socket.emit('chat_message', { id: 'system', name: 'System', message: `✅ Granted ${amount} XP.` });
        } else if (message.startsWith('/give_level ')) {
          const amount = parseInt(parts[1]) || 1;
          socket.emit('give_level', amount);
          socket.emit('chat_message', { id: 'system', name: 'System', message: `✅ Granted ${amount} levels.` });
        } else if (message.startsWith('/mob ')) {
          const mobType = parts[1] || 'slime';
          const mobId = 'mob_admin_' + Date.now();
          room.mobs[mobId] = { id: mobId, type: mobType, x: player.x + 64, y: player.y, vx: 0, vy: 0, hp: mobType === 'golem_boss' ? 300 : 10, maxHp: mobType === 'golem_boss' ? 300 : 10, facingRight: false };
          io.to(currentRoom).emit('mobs_update', room.mobs);
          socket.emit('chat_message', { id: 'system', name: 'System', message: `✅ Spawned mob: ${mobType}.` });
        }
        return;
      }
      
      if (message.startsWith('/spawn')) {
         socket.emit('teleport', { x: 4000, y: 1000 }); // Will teleport player and let physics drop them to spawn
         socket.emit('chat_message', { id: 'system', name: 'System', message: `Teleported to spawn.` });
         return;
      }

      if (message.startsWith('/w ') || message.startsWith('/whisper ')) {
        const parts = message.split(' ');
        if (parts.length >= 3) {
           const targetName = parts[1].toLowerCase();
           const whisperMsg = parts.slice(2).join(' ');
           
           let targetSocketId = null;
           let actualTargetName = '';
           
           // Search all rooms to allow cross-server whispers!
           for (const rId in activeRooms) {
               for (const p of Object.values(activeRooms[rId].players)) {
                  if (p.name.toLowerCase() === targetName) {
                     targetSocketId = p.id;
                     actualTargetName = p.name;
                     break;
                  }
               }
               if (targetSocketId) break;
           }

           if (targetSocketId) {
              io.to(targetSocketId).emit('chat_message', { id: socket.id, name: player.name, message: `(Whisper from ${player.name}): ${whisperMsg}` });
              socket.emit('chat_message', { id: socket.id, name: player.name, message: `(Whisper to ${actualTargetName}): ${whisperMsg}` });
           } else {
              socket.emit('chat_message', { id: 'system', name: 'System', message: `Player ${parts[1]} not found or offline.` });
           }
        }
      } else {
        io.to(currentRoom).emit('chat_message', { id: socket.id, name: player.name, message });
      }
    });



    
    socket.on('drop_item', (data: { type: number, count: number, facingRight: boolean }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const player = activeRooms[currentRoom].players[socket.id];
      if (!player) return;
      
      const itemId = 'item_' + Date.now() + '_' + Math.floor(Math.random()*1000);
      const tossVx = data.facingRight ? 10 : -10;
      activeRooms[currentRoom].items[itemId] = {
        id: itemId,
        type: data.type,
        count: data.count,
        x: player.x + (data.facingRight ? 32 : -16),
        y: player.y - 16, // Throw from chest height
        vx: tossVx,
        vy: -8 // toss up a bit
      };
      io.to(currentRoom).emit('world_state', activeRooms[currentRoom]);
    });

    socket.on('player_update',
 (data: {x: number, y: number, vx: number, vy: number, facingRight: boolean, tool?: number | null, isMining?: boolean, skin?: string, name?: string, helmet?: number | null, chest?: number | null}) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      
      const player = activeRooms[currentRoom].players[socket.id];
      if (player) {
        player.x = data.x;
        player.y = data.y;
        player.vx = data.vx;
        player.vy = data.vy;
        player.facingRight = data.facingRight;
        if (data.tool !== undefined) player.tool = data.tool;
        if (data.isMining !== undefined) 
        player.isMining = data.isMining;
        
        if (data.skin) player.skin = data.skin;
        if (data.name) player.name = data.name;
        player.helmet = data.helmet;
        player.chest = data.chest;


        
        // Broadcast to everyone else
        socket.to(currentRoom).emit('player_moved', { id: socket.id, ...data });
      }
    });

    socket.on('block_update', (data: { tx: number, ty: number, blockType: number }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const { world } = activeRooms[currentRoom];
      
      if (data.tx >= 0 && data.tx < world.length && data.ty >= 0 && data.ty < world[0].length) {
        world[data.tx][data.ty] = data.blockType;
        // Broadcast to everyone in room including sender (or maybe sender predicts locally? Sender can predict locally, so broadcast to others)
        socket.to(currentRoom).emit('world_updated', data);
      }
    });

    
    socket.on('fire_projectile', (data: { type: string, x: number, y: number, vx: number, vy: number, damage?: number }) => {
        if (currentRoom && activeRooms[currentRoom]) {
            const room = activeRooms[currentRoom];
            const pId = 'proj_' + Math.random().toString(36).substr(2, 9);
            room.projectiles[pId] = {
                id: pId,
                ownerId: socket.id,
                type: data.type,
                x: data.x,
                y: data.y,
                vx: data.vx,
                vy: data.vy,
                life: data.type === 'trap' ? 1000 : (data.type === 'grenade' ? 60 : (data.type === 'fireball' || data.type === 'frostbolt' || data.type === 'arcane_blast' ? 80 : (data.type === 'poison_arrow' ? 45 : 40))),
                damage: data.damage !== undefined ? data.damage : (data.type === 'bullet' ? 15 : (data.type === 'arrow' ? 8 : (data.type === 'fireball' ? 30 : 0)))
            };
        }
    });


    socket.on('grapple_pull', (data: { targetId: string, hx: number, hy: number }) => {
      if (currentRoom) {
         io.to(data.targetId).emit('grappled', { hx: data.hx, hy: data.hy });
      }
    });

    socket.on('hit_player', (data: { targetId: string, damage: number, facingRight: boolean }) => {
      if (currentRoom && activeRooms[currentRoom]) {
        const room = activeRooms[currentRoom];
        const targetPlayer = room.players[data.targetId];
        if (targetPlayer) {
            // Apply damage locally on their client
            io.to(data.targetId).emit('take_damage', { amount: data.damage || 5, facingRight: data.facingRight });
            // Emit damage indicator
            io.to(currentRoom).emit('damage_indicator', {
                id: Math.random().toString(),
                x: targetPlayer.x,
                y: targetPlayer.y,
                damage: data.damage || 5, isPlayer: true
            });
        }
      }
    });

    socket.on('hit_mob', (data: { mobId: string, damage: number, facingRight: boolean, playerId?: string }) => {
      if (currentRoom && activeRooms[currentRoom]) {
        const room = activeRooms[currentRoom];
        const primaryMob = room.mobs[data.mobId];
        if (primaryMob) {
          const hitX = primaryMob.x;
          const hitY = primaryMob.y;
          const splashRadius = 64; // ~2 blocks splash damage

          for (const mId in room.mobs) {
            const m = room.mobs[mId];
            const dist = Math.sqrt(Math.pow(m.x - hitX, 2) + Math.pow(m.y - hitY, 2));
            if (dist <= splashRadius) {
              m.hp -= (data.damage || 1);
              m.vy = -6;
              m.vx = (m.x > hitX) ? 8 : (m.x < hitX) ? -8 : (data.facingRight ? 8 : -8);
              m.lastHitBy = socket.id; // Always use authoritative socket.id
              
              // Emit damage indicator
              io.to(currentRoom).emit('damage_indicator', { 
                id: Math.random().toString(), 
                x: m.x, 
                y: m.y, 
                damage: data.damage || 1, isPlayer: false 
              });
            }
          }
        }
      }
    });

    socket.on('use_ability', (data: { ability: string, targetId?: string, targetType?: string, facingRight?: boolean }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const room = activeRooms[currentRoom];
      const player = room.players[socket.id];
      if (!player) return;

      if (data.ability === 'heal') {
          player.hp = Math.min(100, (player.hp || 100) + 20);
          socket.emit('heal', { amount: 20 });
          // Broadcast animation
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'heal' });
      } else if (data.ability === 'slash') {
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'slash' });
          // Server-side slash damage
          const range = 120;
          const damage = 15;
          const hitBox = {
              x: data.facingRight ? player.x : player.x - range,
              y: player.y - 10,
              w: range + 24,
              h: 46
          };
          for (const mId in room.mobs) {
              const m = room.mobs[mId];
              if (m.x < hitBox.x + hitBox.w && m.x + 24 > hitBox.x && m.y < hitBox.y + hitBox.h && m.y + 24 > hitBox.y) {
                  m.hp -= damage;
                  m.lastHitBy = socket.id;
                  m.vy = -4;
                  m.vx = data.facingRight ? 5 : -5;
                  io.to(currentRoom).emit('damage_indicator', { id: Math.random().toString(), x: m.x, y: m.y, damage, isPlayer: false });

          }
          }

      } else if (data.ability === 'ground_slam') {
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'slash' });
          const range = 80;
          const damage = 35;
          for (const mId in room.mobs) {
              const m = room.mobs[mId];
              const dist = Math.hypot(m.x - player.x, m.y - player.y);
              if (dist < range) {
                  m.hp -= damage;
                  m.lastHitBy = socket.id;
                  m.vy = -7;
                  m.vx = (m.x > player.x) ? 3 : -3;
                  io.to(currentRoom).emit('damage_indicator', { id: Math.random().toString(), x: m.x, y: m.y, damage, isPlayer: false });
              }
          }
      } else if (data.ability === 'battle_shout') {
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'heal' });
          player.hp = Math.min(100, (player.hp || 100) + 15);
          socket.emit('heal', { amount: 15 });
          // could add buff later
      } else if (data.ability === 'teleport') {
          player.x += data.facingRight ? 120 : -120;
          // clamp to world
          player.x = Math.max(32, Math.min(player.x, 990 * 32));
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'heal' });

      } else if (data.ability === 'whirlwind') {
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'slash' });
          const range = 120;
          const damage = 25;
          for (const mId in room.mobs) {
              const m = room.mobs[mId];
              const dist = Math.hypot(m.x - player.x, m.y - player.y);
              if (dist < range) {
                  m.hp -= damage;
                  m.lastHitBy = socket.id;
                  m.vy = -5;
                  m.vx = (m.x > player.x) ? 6 : -6;
                  io.to(currentRoom).emit('damage_indicator', { id: Math.random().toString(), x: m.x, y: m.y, damage, isPlayer: false });
              }
          }
      } else if (data.ability === 'trap') {
          const id = 'trap_' + Date.now();
          room.projectiles[id] = {
              id, type: 'trap', owner: socket.id,
              x: player.x, y: player.y,
              vx: 0, vy: 0, damage: 30,
              life: 1000 // lives for long
          };
      } else if (data.ability === 'fireball' && data.targetId && data.targetType) {
          const targetObj = data.targetType === 'mob' ? room.mobs[data.targetId] : room.players[data.targetId];
          if (targetObj) {
              const damage = 25;
              targetObj.hp -= damage;
              io.to(currentRoom).emit('damage_indicator', { id: Math.random().toString(), x: targetObj.x, y: targetObj.y, damage, isPlayer: false });
              if (data.targetType === 'mob') {
                  const m = targetObj as any;
                  m.vy = -6;
                  m.vx = (player.x < m.x) ? 8 : -8;
                  m.lastHitBy = socket.id;
              }
          }
      }
    });

    
    socket.on('send_trade_request', (data: { targetId: string }) => {
       if (currentRoom && activeRooms[currentRoom].players[data.targetId]) {
           const senderName = activeRooms[currentRoom].players[socket.id]?.name || 'Player';
           io.to(data.targetId).emit('trade_request', { senderId: socket.id, senderName });
       }
    });
    
    socket.on('send_party_invite', (data: { targetId: string }) => {
       if (currentRoom && activeRooms[currentRoom].players[data.targetId]) {
           const senderName = activeRooms[currentRoom].players[socket.id]?.name || 'Player';
           io.to(data.targetId).emit('party_invite', { senderId: socket.id, senderName });
       }
    });
    

    socket.on('send_duel_request', (data: { targetId: string }) => {
       if (currentRoom && activeRooms[currentRoom].players[data.targetId]) {
           const senderName = activeRooms[currentRoom].players[socket.id]?.name || 'Player';
           io.to(data.targetId).emit('duel_request', { senderId: socket.id, senderName });
       }
    });
    socket.on('accept_duel', (data: { senderId: string }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const room = activeRooms[currentRoom];
           if (room.players[data.senderId] && room.players[socket.id]) {
               // Initiate Duel (Turn on PvP for both towards each other)
               io.to(data.senderId).emit('duel_started', { opponentId: socket.id, opponentName: room.players[socket.id].name });
               io.to(socket.id).emit('duel_started', { opponentId: data.senderId, opponentName: room.players[data.senderId].name });
           }
       }
    });

    socket.on('send_friend_request', (data: { targetId: string }) => {
       if (currentRoom && activeRooms[currentRoom].players[data.targetId]) {
           const senderName = activeRooms[currentRoom].players[socket.id]?.name || 'Player';
           io.to(data.targetId).emit('friend_request', { senderId: socket.id, senderName });
       }
    });


    socket.on('queue_instance', (data: { instanceId: string }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const room = activeRooms[currentRoom];
           const player = room.players[socket.id];
           if (player) {
               if (player.partyId && room.parties[player.partyId]) {
                   const party = room.parties[player.partyId];
                   party.queueingFor = data.instanceId;
                   party.readyCheck = {};
                   party.members.forEach(mId => {
                       party.readyCheck[mId] = false;
                       io.to(mId).emit('party_ready_check', { instanceId: data.instanceId });
                   });
               } else {
                   // Solo queue
                   socket.emit('instance_joined', { instanceId: data.instanceId + '_' + Date.now() });
               }
           }
       }
    });

    socket.on('accept_ready_check', () => {
       if (currentRoom && activeRooms[currentRoom]) {
           const room = activeRooms[currentRoom];
           const player = room.players[socket.id];
           if (player && player.partyId && room.parties[player.partyId]) {
               const party = room.parties[player.partyId];
               if (party.readyCheck) {
                   party.readyCheck[socket.id] = true;
                   
                   // Check if everyone is ready
                   const allReady = party.members.every(mId => party.readyCheck[mId]);
                   if (allReady) {
                       const instanceId = party.queueingFor + '_' + Date.now();
                       party.members.forEach(mId => {
                           io.to(mId).emit('instance_joined', { instanceId });
                       });
                       delete party.queueingFor;
                       delete party.readyCheck;
                   } else {
                       party.members.forEach(mId => {
                           io.to(mId).emit('party_update', party);
                       });
                   }
               }
           }
       }
    });

    socket.on('decline_ready_check', () => {
       if (currentRoom && activeRooms[currentRoom]) {
           const room = activeRooms[currentRoom];
           const player = room.players[socket.id];
           if (player && player.partyId && room.parties[player.partyId]) {
               const party = room.parties[player.partyId];
               if (party.readyCheck) {
                   delete party.queueingFor;
                   delete party.readyCheck;
                   party.members.forEach(mId => {
                       io.to(mId).emit('ready_check_cancelled');
                       io.to(mId).emit('party_update', party);
                   });
               }
           }
       }
    });

    socket.on('accept_party_invite', (data: { senderId: string }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const room = activeRooms[currentRoom];
           if (room.players[data.senderId] && room.players[socket.id]) {
               let partyId = room.players[data.senderId].partyId;
               if (!partyId) {
                   partyId = "gang_" + data.senderId;
                   room.players[data.senderId].partyId = partyId;
                   room.parties[partyId] = { id: partyId, members: [data.senderId] };
               }
               
               if (!room.parties[partyId].members.includes(socket.id)) {
                   room.parties[partyId].members.push(socket.id);
               }
               room.players[socket.id].partyId = partyId;
               
               // Broadcast party update to members
               room.parties[partyId].members.forEach(memberId => {
                   io.to(memberId).emit('party_update', room.parties[partyId]);
               });
           }
       }
    });

    socket.on('accept_trade_request', (data: { senderId: string }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const room = activeRooms[currentRoom];
           if (room.players[data.senderId] && room.players[socket.id]) {
               const tradeId = "trade_" + data.senderId + "_" + socket.id;
               room.trades[tradeId] = {
                   id: tradeId,
                   p1: data.senderId,
                   p2: socket.id,
                   p1Items: Array(9).fill(null),
                   p2Items: Array(9).fill(null),
                   p1Confirm: false,
                   p2Confirm: false
               };
               io.to(data.senderId).emit('trade_started', { tradeId, peerId: socket.id, peerName: room.players[socket.id].name, role: 'p1' });
               io.to(socket.id).emit('trade_started', { tradeId, peerId: data.senderId, peerName: room.players[data.senderId].name, role: 'p2' });
           }
       }
    });
    
    socket.on('update_trade_item', (data: { tradeId: string, role: 'p1'|'p2', index: number, item: any }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const trade = activeRooms[currentRoom].trades[data.tradeId];
           if (trade) {
               if (data.role === 'p1') {
                   trade.p1Items[data.index] = data.item;
                   trade.p1Confirm = false;
                   trade.p2Confirm = false;
               } else {
                   trade.p2Items[data.index] = data.item;
                   trade.p1Confirm = false;
                   trade.p2Confirm = false;
               }
               io.to(trade.p1).emit('trade_updated', trade);
               io.to(trade.p2).emit('trade_updated', trade);
           }
       }
    });

    socket.on('toggle_trade_confirm', (data: { tradeId: string, role: 'p1'|'p2' }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const trade = activeRooms[currentRoom].trades[data.tradeId];
           if (trade) {
               if (data.role === 'p1') trade.p1Confirm = !trade.p1Confirm;
               else trade.p2Confirm = !trade.p2Confirm;
               
               if (trade.p1Confirm && trade.p2Confirm) {
                   // Complete trade
                   processTrade(trade, activeRooms[currentRoom], io, db);
                   delete activeRooms[currentRoom].trades[data.tradeId];
               } else {
                   io.to(trade.p1).emit('trade_updated', trade);
                   io.to(trade.p2).emit('trade_updated', trade);
               }
           }
       }
    });
    
    socket.on('cancel_trade', (data: { tradeId: string }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const trade = activeRooms[currentRoom].trades[data.tradeId];
           if (trade) {
               io.to(trade.p1).emit('trade_cancelled', { returnedItems: trade.p1Items });
               io.to(trade.p2).emit('trade_cancelled', { returnedItems: trade.p2Items });
               delete activeRooms[currentRoom].trades[data.tradeId];
           }
       }
    });

    socket.on('disconnect', () => {
      if (currentRoom && activeRooms[currentRoom]) {
        delete activeRooms[currentRoom].players[socket.id];
        io.to(currentRoom).emit('player_left', socket.id);
        
        // Optional: Clean up empty rooms after some time
        if (Object.keys(activeRooms[currentRoom].players).length === 0) {
          // We could delete the room here, but maybe we want persistence while server runs?
          // delete activeRooms[currentRoom];
        }
      }
    });
  });

  // --- Vite / Static serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
async function processTrade(trade: any, room: any, io: any, db: any) {
    const p1 = room.players[trade.p1];
    const p2 = room.players[trade.p2];
    
    if (!p1.uid || !p1.profileId || !p2.uid || !p2.profileId) {
        io.to(trade.p1).emit('trade_cancelled', { reason: 'Missing profile data' });
        io.to(trade.p2).emit('trade_cancelled', { reason: 'Missing profile data' });
        return;
    }

    try {
        await db.runTransaction(async (t) => {
            const p1Ref = db.doc(`users/${p1.uid}/profiles/${p1.profileId}`);
            const p2Ref = db.doc(`users/${p2.uid}/profiles/${p2.profileId}`);
            
            const p1Doc = await t.get(p1Ref);
            const p2Doc = await t.get(p2Ref);
            
            if (!p1Doc.exists || !p2Doc.exists) throw new Error("Profile not found");
            
            const p1Data = p1Doc.data();
            const p2Data = p2Doc.data();
            
            // Helper to deduct items
            const deductItems = (data: any, itemsToDeduct: any[]) => {
                let success = true;
                const inventories = ['hotbar', 'backpack', 'leftActionBar', 'rightActionBar'];
                const parsed = inventories.map(k => data[k] ? JSON.parse(data[k]) : []);
                
                for (const item of itemsToDeduct) {
                    if (!item) continue;
                    let remaining = item.count;
                    for (const inv of parsed) {
                        for (const slot of inv) {
                            if (slot && slot.type === item.type) {
                                const take = Math.min(slot.count, remaining);
                                slot.count -= take;
                                remaining -= take;
                                if (slot.count <= 0) {
                                    slot.type = 0; // or null, let's just make it null later
                                }
                            }
                            if (remaining <= 0) break;
                        }
                        if (remaining <= 0) break;
                    }
                    if (remaining > 0) {
                        success = false;
                        break;
                    }
                }
                
                if (success) {
                    inventories.forEach((k, i) => {
                        const cleaned = parsed[i].map(s => (s && s.count > 0 && s.type !== 0) ? s : null);
                        data[k] = JSON.stringify(cleaned);
                    });
                }
                
                return success;
            };

            // Helper to add items
            const addItems = (data: any, itemsToAdd: any[]) => {
                let success = true;
                const inventories = ['hotbar', 'backpack', 'leftActionBar', 'rightActionBar'];
                const parsed = inventories.map(k => data[k] ? JSON.parse(data[k]) : []);
                
                for (const item of itemsToAdd) {
                    if (!item) continue;
                    let remaining = item.count;
                    // Try to stack first
                    for (const inv of parsed) {
                        for (const slot of inv) {
                            if (slot && slot.type === item.type) {
                                const space = 99 - slot.count;
                                if (space > 0) {
                                    const add = Math.min(space, remaining);
                                    slot.count += add;
                                    remaining -= add;
                                }
                            }
                            if (remaining <= 0) break;
                        }
                        if (remaining <= 0) break;
                    }
                    // Try empty slots
                    if (remaining > 0) {
                        for (const inv of parsed) {
                            for (let i=0; i<inv.length; i++) {
                                if (!inv[i] || inv[i].type === 0 || inv[i].count <= 0) {
                                    const add = Math.min(99, remaining);
                                    inv[i] = { type: item.type, count: add };
                                    remaining -= add;
                                }
                                if (remaining <= 0) break;
                            }
                            if (remaining <= 0) break;
                        }
                    }
                    
                    if (remaining > 0) {
                        success = false;
                        break;
                    }
                }
                
                if (success) {
                    inventories.forEach((k, i) => {
                        data[k] = JSON.stringify(parsed[i]);
                    });
                }
                
                return success;
            };

            if (!deductItems(p1Data, trade.p1Items)) throw new Error("P1 missing items");
            if (!deductItems(p2Data, trade.p2Items)) throw new Error("P2 missing items");
            
            if (!addItems(p1Data, trade.p2Items)) throw new Error("P1 inventory full");
            if (!addItems(p2Data, trade.p1Items)) throw new Error("P2 inventory full");

            p1Data.updatedAt = Date.now();
            p2Data.updatedAt = Date.now();
            
            t.update(p1Ref, p1Data);
            t.update(p2Ref, p2Data);
            
            io.to(trade.p1).emit('trade_completed', { success: true, newProfile: p1Data });
            io.to(trade.p2).emit('trade_completed', { success: true, newProfile: p2Data });
        });
    } catch (e: any) {
        console.error("Trade transaction failed: ", e);
        io.to(trade.p1).emit('trade_cancelled', { reason: e.message || 'Trade failed' });
        io.to(trade.p2).emit('trade_cancelled', { reason: e.message || 'Trade failed' });
    }
}
