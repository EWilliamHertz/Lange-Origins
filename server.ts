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
  app.post('/api/admin/wipe', (req, res) => {
    const { email, roomId } = req.body;
    if (email !== 'ewilliamhe@gmail.com' && email !== 'zudran@gmail.com') return res.status(403).json({error: "Unauthorized"});
    
    const targetRoom = roomId || 'public-lobby';
    if (activeRooms[targetRoom]) {
      activeRooms[targetRoom].world = generateWorld(targetRoom);
      activeRooms[targetRoom].chests = {};
      activeRooms[targetRoom].items = {};
      activeRooms[targetRoom].mobs = {};
      
      // Notify all players in that room
      io.to(targetRoom).emit('world_wiped', { world: activeRooms[targetRoom].world });
      res.json({ success: true, message: `World ${targetRoom} wiped successfully.` });
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
  const activeRooms: Record<string, {
    world: World;
    players: Record<string, any>;
    mobs: Record<string, any>;
    items: Record<string, any>;
    chests: Record<string, any[]>;
    createdAt: number;
  }> = {
    'public-lobby': {
      world: generateWorld('public-lobby'),
      players: {},
      mobs: {},
      items: {},
      chests: {},
      createdAt: Date.now()
    }
  };

  setInterval(() => {
    for (const roomId in activeRooms) {
      const room = activeRooms[roomId];
      let mobsUpdated = false;
      let itemsUpdated = false;
      
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
          item.vy = 0;
          item.vx = 0;
          item.y = ty * 32 - 16 - 0.01;
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
          delete room.mobs[mobId];
          mobsUpdated = true;
          continue;
        }

        // Normal AI Movement or Knockback
        if (Math.abs(mob.vx) > 3) {
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
      if (Object.keys(room.mobs).length < 5 && Math.random() < 0.05) {
        const spawnX = Math.floor(room.world.length / 2) + Math.floor((Math.random() - 0.5) * 40);
        let spawnY = 0;
        while (spawnY < room.world[0].length && room.world[spawnX][spawnY] === 0) {
          spawnY++;
        }
        
        const elapsedMs = Date.now() - room.createdAt;
        const timeOfDay = (0.35 + elapsedMs * 0.00001) % 1.0;
        const isNight = timeOfDay < 0.2 || timeOfDay > 0.8;
        
        const type = isNight ? 'zombie' : 'slime';
        
        const mobId = 'mob_' + Date.now() + Math.floor(Math.random()*1000);
        room.mobs[mobId] = {
          id: mobId,
          type: type,
          x: spawnX * 32,
          y: (spawnY - 2) * 32,
          vx: 0, vy: 0, hp: 10, facingRight: Math.random() > 0.5
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

    socket.on('join_room', (roomId: string) => {
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
          mobs: {},
          items: {},
          chests: {},
          createdAt: Date.now()
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
      activeRooms[roomId].players[socket.id] = { id: socket.id, x: startX, y: startY, facingRight: true, vx: 0, vy: 0 };

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

    socket.on('open_chest', (data: { tx: number, ty: number }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const chestKey = `${data.tx}_${data.ty}`;
      if (!activeRooms[currentRoom].chests[chestKey]) {
        activeRooms[currentRoom].chests[chestKey] = Array(27).fill(null);
      }
      socket.emit('chest_data', { tx: data.tx, ty: data.ty, inventory: activeRooms[currentRoom].chests[chestKey] });
    });

    socket.on('update_chest', (data: { tx: number, ty: number, inventory: any[] }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const chestKey = `${data.tx}_${data.ty}`;
      activeRooms[currentRoom].chests[chestKey] = data.inventory;
      socket.to(currentRoom).emit('chest_updated', { tx: data.tx, ty: data.ty, inventory: data.inventory });
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
      if (currentRoom) {
        io.to(currentRoom).emit('chat_message', { id: socket.id, message });
      }
    });

    socket.on('player_update', (data: {x: number, y: number, vx: number, vy: number, facingRight: boolean, tool?: number | null, isMining?: boolean}) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      
      const player = activeRooms[currentRoom].players[socket.id];
      if (player) {
        player.x = data.x;
        player.y = data.y;
        player.vx = data.vx;
        player.vy = data.vy;
        player.facingRight = data.facingRight;
        if (data.tool !== undefined) player.tool = data.tool;
        if (data.isMining !== undefined) player.isMining = data.isMining;
        
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

    socket.on('hit_mob', (data: { mobId: string, damage: number, facingRight: boolean }) => {
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
              // knockback away from hit center, or default to facing direction if exact same spot
              m.vx = (m.x > hitX) ? 8 : (m.x < hitX) ? -8 : (data.facingRight ? 8 : -8); 
              
              // Emit damage indicator
              io.to(currentRoom).emit('damage_indicator', { 
                id: Math.random().toString(), 
                x: m.x, 
                y: m.y, 
                damage: data.damage || 1 
              });
            }
          }
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
