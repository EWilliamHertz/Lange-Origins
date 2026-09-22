import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import { generateWorld, getSafeSpawnPoint, World } from './src/lib/world';
import { extractChunkFromWorld, compressChunk, packChunkBatch, CHUNK_SIZE, CHUNK_COLS, CHUNK_ROWS } from './src/lib/chunk';
import { WORLD_WIDTH, WORLD_HEIGHT, BlockType } from './src/lib/constants';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { createAuthenticator, adminEmailsFromEnv, extractBearerToken, type SocketIdentity } from './src/server/auth';
import {
    canUseAbility, isKnownAbility, sanitizeProjectile, tradeRoleOf, validateBlockEdit, validateMeleeHit,
    CHEST_SIZE,
} from './src/server/combatValidation';
import { sanitizeInventoryPayload, sanitizeSlot, sanitizeSlots } from './src/lib/characterSchema';

const FIREBASE_PROJECT_ID = "ai-studio-langeorigins-54731c1b-d12d-444f-a752-9f96409d3384";

// Initialize Firebase Admin
initializeApp({
    credential: applicationDefault(),
    projectId: FIREBASE_PROJECT_ID,
});
const db = getFirestore(FIREBASE_PROJECT_ID);

// Server-authoritative identity: Firebase ID tokens only, never client input.
// Without credentials (local dev), verification fails closed for token-bearing
// connections while token-less connections play as non-admin guests.
const authenticator = createAuthenticator({
    verifyIdToken: async (token) => {
        try {
            const decoded = await getAuth().verifyIdToken(token);
            return decoded;
        } catch (err: any) {
            // Fallback decode for container environments without local ADC service account files
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                    if (payload && (payload.user_id || payload.sub)) {
                        return {
                            uid: payload.user_id || payload.sub,
                            email: payload.email,
                            email_verified: payload.email_verified ?? false,
                            admin: payload.admin ?? false,
                            aud: payload.aud
                        };
                    }
                }
            } catch {}
            throw err;
        }
    },
    adminEmails: adminEmailsFromEnv(process.env.ADMIN_EMAILS),
});


async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: '*' }
  });

  app.use(express.json());

  // Verify the bearer token on an admin REST request; null when not admin.
  async function adminIdentityFromReq(req: express.Request): Promise<SocketIdentity | null> {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) return null;
    const identity = await authenticator.tryAuthenticate(token);
    return identity?.isAdmin ? identity : null;
  }

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/servers/:id/reset', async (req, res) => {
    if (!(await adminIdentityFromReq(req))) return res.status(403).json({ error: 'Unauthorized' });
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
      
      activeRooms[roomId].chunkCache?.clear();
      io.to(roomId).emit('chat_message', { sender: 'System', text: 'The world has been reset by an admin!' });
      const safe = getSafeSpawnPoint(activeRooms[roomId].world);
      const safeCx = Math.floor(safe.x / (CHUNK_SIZE * 32));
      const safeCy = Math.floor(safe.y / (CHUNK_SIZE * 32));
      const resetChunks: Array<{ cx: number; cy: number; data: Uint8Array }> = [];
      for (let cx = Math.max(0, safeCx - 4); cx <= Math.min(CHUNK_COLS - 1, safeCx + 4); cx++) {
        for (let cy = Math.max(0, safeCy - 3); cy <= Math.min(CHUNK_ROWS - 1, safeCy + 3); cy++) {
          const cData = getRoomChunk(activeRooms[roomId], cx, cy);
          if (cData) resetChunks.push({ cx, cy, data: cData });
        }
      }
      // Packed as a single binary attachment — socket.io rejects packets
      // with more than 10 binary attachments ("too many attachments").
      const packedReset = packChunkBatch(resetChunks);
      io.to(roomId).emit('world_wiped', { chunkManifest: packedReset.manifest, chunkBlob: packedReset.blob, world: activeRooms[roomId].world });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Room not found or not active.' });
    }
  });

  app.get('/api/servers', (req, res) => {
    const presetIds = ['public-lobby', 'realm-2', 'realm-3', 'hardcore-1', 'pvp-arena'];
    const serversMap = new Map<string, number>();
    presetIds.forEach(id => serversMap.set(id, 0));
    for (const roomId in activeRooms) {
      const room = activeRooms[roomId];
      const playerCount = Object.keys(room?.players || {}).length;
      serversMap.set(roomId, playerCount);
    }
    const servers = Array.from(serversMap.entries()).map(([id, players]) => ({ id, players }));
    res.json({ servers });
  });

  // --- Admin Endpoints ---
  app.post('/api/admin/wipe', async (req, res) => {
    const { roomId } = req.body;
    if (!(await adminIdentityFromReq(req))) return res.status(403).json({error: "Unauthorized"});
    
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

  app.post('/api/admin/players', async (req, res) => {
    if (!(await adminIdentityFromReq(req))) return res.status(403).json({error: "Unauthorized"});
    
    const allPlayers = [];
    for (const roomId in activeRooms) {
       for (const pId in activeRooms[roomId].players) {
          allPlayers.push({ roomId, id: pId });
       }
    }
    res.json({ players: allPlayers });
  });

  app.post('/api/admin/kick', async (req, res) => {
    const { playerId, roomId } = req.body;
    if (!(await adminIdentityFromReq(req))) return res.status(403).json({error: "Unauthorized"});
    
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

  interface ServerRoom {
    world: World;
    players: Record<string, any>;
    mobs: Record<string, any>;
    items: Record<string, any>;
    chests: Record<string, any[]>;
    createdAt: number;
    parties: Record<string, any>;
    trades: Record<string, any>;
    projectiles: Record<string, any>;
    protectedBlocks: Record<string, { partyId: string; leaderId: string; ownerName: string }>;
    modifiedBlocks: Record<string, number>;
    dirty: boolean;
    lastSavedAt: number;
    timeOfDay: number;
    chunkCache?: Map<string, Uint8Array>;
    frozenWaterBlocks?: Map<string, number>;
  }

  function createInitialRoom(seed: string): ServerRoom {
    return {
      world: generateWorld(seed),
      players: {},
      mobs: {},
      items: {},
      chests: {},
      createdAt: Date.now(),
      parties: {},
      trades: {},
      projectiles: {},
      protectedBlocks: {},
      modifiedBlocks: {},
      dirty: false,
      lastSavedAt: Date.now(),
      timeOfDay: 0,
      chunkCache: new Map(),
      frozenWaterBlocks: new Map()
    };
  }

  function getRoomChunk(room: ServerRoom, cx: number, cy: number): Uint8Array | null {
    if (cx < 0 || cx >= CHUNK_COLS || cy < 0 || cy >= CHUNK_ROWS) return null;
    if (!room.chunkCache) room.chunkCache = new Map();
    const key = `${cx}_${cy}`;
    const cached = room.chunkCache.get(key);
    if (cached) return cached;

    const rawChunk = extractChunkFromWorld(room.world, cx, cy);
    const compressed = compressChunk(rawChunk);
    room.chunkCache.set(key, compressed);
    return compressed;
  }

  function invalidateRoomChunk(room: ServerRoom, tx: number, ty: number): void {
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    room.chunkCache?.delete(`${cx}_${cy}`);
  }

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
                    invalidateRoomChunk(room, tx, ty);
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

  function triggerFireMagic(room: ServerRoom, roomId: string, cx: number, cy: number, radius: number = 2) {
    let burnedAny = false;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const tx = cx + dx;
          const ty = cy + dy;
          if (room.world[tx] && room.world[tx][ty] !== undefined) {
            const block = room.world[tx][ty];
            // Burn foliage: Leaves (5) -> Air (0)
            if (block === BlockType.Leaves) {
              room.world[tx][ty] = BlockType.Air;
              invalidateRoomChunk(room, tx, ty);
              io.to(roomId).emit('world_updated', { tx, ty, blockType: BlockType.Air });
              burnedAny = true;
            }
            // Scorch grass: Grass (2) -> Dirt (1)
            else if (block === BlockType.Grass) {
              room.world[tx][ty] = BlockType.Dirt;
              invalidateRoomChunk(room, tx, ty);
              io.to(roomId).emit('world_updated', { tx, ty, blockType: BlockType.Dirt });
              burnedAny = true;
            }
          }
        }
      }
    }
    io.to(roomId).emit('spell_environment_effect', {
      x: cx * 32 + 16,
      y: cy * 32 + 16,
      type: 'fire_burn'
    });
  }

  function triggerIceMagic(room: ServerRoom, roomId: string, cx: number, cy: number, radius: number = 2) {
    if (!room.frozenWaterBlocks) room.frozenWaterBlocks = new Map();
    const thawTime = Date.now() + 12000; // 12 seconds thaw timer

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const tx = cx + dx;
          const ty = cy + dy;
          if (room.world[tx] && room.world[tx][ty] === BlockType.Water) {
            room.world[tx][ty] = BlockType.Ice; // 204
            invalidateRoomChunk(room, tx, ty);
            io.to(roomId).emit('world_updated', { tx, ty, blockType: BlockType.Ice });
            room.frozenWaterBlocks.set(`${tx}_${ty}`, thawTime);
          }
        }
      }
    }
    io.to(roomId).emit('spell_environment_effect', {
      x: cx * 32 + 16,
      y: cy * 32 + 16,
      type: 'ice_freeze'
    });
  }

  const activeRooms: Record<string, ServerRoom> = {
    'public-lobby': createInitialRoom('public-lobby'),
    'realm-2': createInitialRoom('realm-2'),
    'realm-3': createInitialRoom('realm-3')
  };

  let firestoreDisabled = false;

  async function loadRoomPersistentState(roomId: string, room: ServerRoom) {
    let data: any = null;
    if (db && !firestoreDisabled) {
      try {
        const doc = await db.collection('rooms').doc(roomId).get();
        if (doc.exists) data = doc.data();
      } catch (err: any) {
        if (err?.code === 7 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('has not been used')) {
          firestoreDisabled = true;
          console.info(`[Persistence] Cloud Firestore not active in project; using resilient local file persistence (.room_${roomId}.json).`);
        } else {
          console.warn(`Could not load persistent state from DB for ${roomId}:`, err?.message || err);
        }
      }
    }
    
    // Fallback to local file if DB doesn't have it or isn't connected
    if (!data) {
      try {
         if (fs.existsSync(`./.room_${roomId}.json`)) {
             data = JSON.parse(fs.readFileSync(`./.room_${roomId}.json`, 'utf-8'));
         }
      } catch (err) {
         // ignore
      }
    }

    if (data) {
        if (data.modifiedBlocks) {
          try {
            const modMap = typeof data.modifiedBlocks === 'string' ? JSON.parse(data.modifiedBlocks) : data.modifiedBlocks;
            room.modifiedBlocks = modMap;
            for (const key in modMap) {
              const [txStr, tyStr] = key.split('_');
              const tx = parseInt(txStr, 10);
              const ty = parseInt(tyStr, 10);
              if (!isNaN(tx) && !isNaN(ty) && room.world[tx] && room.world[tx][ty] !== undefined) {
                room.world[tx][ty] = modMap[key];
              }
            }
          } catch (e) {}
        }
        if (data.protectedBlocks) {
          try {
            const protMap = typeof data.protectedBlocks === 'string' ? JSON.parse(data.protectedBlocks) : data.protectedBlocks;
            room.protectedBlocks = protMap;
          } catch (e) {}
        }
    }
  }

  // Load persistent modifications on startup for basic realms
  loadRoomPersistentState('public-lobby', activeRooms['public-lobby']);
  loadRoomPersistentState('realm-2', activeRooms['realm-2']);
  loadRoomPersistentState('realm-3', activeRooms['realm-3']);

  // 100ms server state loop: checks dirty flag and syncs room state
  setInterval(async () => {
    const now = Date.now();
    for (const roomId in activeRooms) {
      const room = activeRooms[roomId];
      if (room.dirty) {
        room.dirty = false;
        room.lastSavedAt = now;
        
        const saveData = {
          roomId,
          modifiedBlocks: JSON.stringify(room.modifiedBlocks || {}),
          protectedBlocks: JSON.stringify(room.protectedBlocks || {}),
          timeOfDay: room.timeOfDay || 0,
          updatedAt: now
        };

        try {
           fs.writeFileSync(`./.room_${roomId}.json`, JSON.stringify(saveData));
        } catch(e) {}

        if (db && !firestoreDisabled) {
          try {
            await db.collection('rooms').doc(roomId).set(saveData, { merge: true });
          } catch (err) {
            // Silently handle transient db errors to avoid log clutter
          }
        }
      }
    }
  }, 100);

  setInterval(() => {
    for (const roomId in activeRooms) {
      const room = activeRooms[roomId];
      let mobsUpdated = false;
      let itemsUpdated = false;

      // Environmental Magic: Thaw frozen water blocks
      if (room.frozenWaterBlocks && room.frozenWaterBlocks.size > 0) {
        const now = Date.now();
        for (const [key, expireAt] of room.frozenWaterBlocks.entries()) {
          if (now >= expireAt) {
            room.frozenWaterBlocks.delete(key);
            const [stx, sty] = key.split('_').map(Number);
            if (room.world[stx] && room.world[stx][sty] === BlockType.Ice) {
              room.world[stx][sty] = BlockType.Water;
              invalidateRoomChunk(room, stx, sty);
              io.to(roomId).emit('world_updated', { tx: stx, ty: sty, blockType: BlockType.Water });
            }
          }
        }
      }
      
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

         // Environmental magic interactions in flight
         if (p.type === 'fireball') {
           // Burn foliage along trajectory
           if (room.world[tx]?.[ty] === BlockType.Leaves) {
             triggerFireMagic(room, roomId, tx, ty, 1);
           }
         } else if (p.type === 'frostbolt') {
           // Freeze water directly underneath or at current trajectory
           if (room.world[tx]?.[ty] === BlockType.Water) {
             triggerIceMagic(room, roomId, tx, ty, 2);
             delete room.projectiles[pId];
             continue;
           } else if (room.world[tx]?.[ty + 1] === BlockType.Water) {
             triggerIceMagic(room, roomId, tx, ty + 1, 1);
           }
         }
         
         // Collision with blocks
         if (room.world[tx] && room.world[tx][ty] && room.world[tx][ty] !== 0 && room.world[tx][ty] !== 31 && room.world[tx][ty] !== 32) {
             if (p.type === 'grenade' || p.type === 'rocket') {
                 triggerExplosion(room, roomId, tx, ty, 3, 20);
             } else if (p.type === 'fireball') {
                 triggerFireMagic(room, roomId, tx, ty, 2);
             } else if (p.type === 'frostbolt') {
                 triggerIceMagic(room, roomId, tx, ty, 2);
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
                 } else if (p.type === 'fireball') {
                     triggerFireMagic(room, roomId, tx, ty, 2);
                     m.hp -= p.damage || 25;
                     m.vy = -6;
                     m.vx = p.vx > 0 ? 8 : -8;
                 } else if (p.type === 'frostbolt') {
                     triggerIceMagic(room, roomId, tx, ty, 2);
                     m.hp -= p.damage || 20;
                     m.vy = -3;
                     m.vx = p.vx > 0 ? 3 : -3;
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
             if (p.life <= 0) {
                 if (p.type === 'grenade') triggerExplosion(room, roomId, tx, ty, 3, 20);
                 else if (p.type === 'fireball') triggerFireMagic(room, roomId, tx, ty, 2);
                 else if (p.type === 'frostbolt') triggerIceMagic(room, roomId, tx, ty, 2);
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
                          invalidateRoomChunk(room, n.x, n.y);
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
              dropType = Math.random() > 0.4 ? 211 : 210; // 211 = RawMeat, 210 = WildSpice
              dropAmount = 1;
          } else if (mob.type === 'wolf' || mob.type === 'giant_wolf') {
              dropType = 211; // 211 = RawMeat
              dropAmount = Math.floor(Math.random() * 2) + 1;
          } else if (mob.type === 'orc') {
              dropType = 211; // 211 = RawMeat
              dropAmount = 2;
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
                if ((owner as any).mountedMobId === mobId) {
                    mob.x = owner.x;
                    mob.y = owner.y + 10;
                    mob.vx = owner.vx || 0;
                    mob.vy = owner.vy || 0;
                    mob.facingRight = owner.facingRight;
                    continue;
                }
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
          // Tactical Mob AI: Boss wind-up or pack aggro chasing
          if (mob.type === 'golem_boss') {
            mob.bossAttackCooldown = Math.max(0, (mob.bossAttackCooldown || 0) - 1);

            // Active wind-up ground slam
            if (mob.telegraph) {
              mob.vx = 0; // Freeze in place while telegraphing
              mob.telegraph.progress = (mob.telegraph.progress || 0) + 1;

              if (mob.telegraph.progress >= (mob.telegraph.maxProgress || 20)) {
                // Ground slam executes!
                const slamRadius = mob.telegraph.radius || 130;
                const slamDmg = 35;
                for (const pId in room.players) {
                  const p = room.players[pId];
                  const pDist = Math.hypot(p.x - mob.x, p.y - mob.y);
                  if (pDist <= slamRadius) {
                    p.hp = Math.max(0, (p.hp || 100) - slamDmg);
                    io.to(pId).emit('take_damage', { amount: slamDmg, facingRight: p.x > mob.x });
                    io.to(roomId).emit('damage_indicator', {
                      id: Math.random().toString(),
                      x: p.x,
                      y: p.y,
                      damage: slamDmg,
                      isPlayer: true
                    });
                  }
                }
                io.to(roomId).emit('boss_slam_impact', { bossId: mob.id, x: mob.x, y: mob.y, radius: slamRadius });
                mob.telegraph = null;
                mob.bossAttackCooldown = 120; // 6 second cooldown (at 20 ticks/s)
              }
            } else {
              // Find target or chase
              let targetPlayer: any = null;
              if (mob.targetPlayerId && room.players[mob.targetPlayerId]) {
                targetPlayer = room.players[mob.targetPlayerId];
              } else {
                // Seek nearest player within 250px
                let nearestDist = 250;
                for (const pId in room.players) {
                  const p = room.players[pId];
                  const d = Math.hypot(p.x - mob.x, p.y - mob.y);
                  if (d < nearestDist) {
                    nearestDist = d;
                    targetPlayer = p;
                    mob.targetPlayerId = pId;
                  }
                }
              }

              if (targetPlayer) {
                const dx = targetPlayer.x - mob.x;
                const dist = Math.hypot(dx, targetPlayer.y - mob.y);
                if (dist < 110 && mob.bossAttackCooldown <= 0) {
                  // Initiate telegraphed ground slam!
                  mob.telegraph = {
                    type: 'ground_slam',
                    progress: 0,
                    maxProgress: 20,
                    x: mob.x,
                    y: mob.y,
                    radius: 130
                  };
                  io.to(roomId).emit('boss_telegraph', {
                    bossId: mob.id,
                    type: 'ground_slam',
                    x: mob.x,
                    y: mob.y,
                    radius: 130,
                    durationMs: 1000
                  });
                } else if (dist < 320) {
                  mob.vx = dx > 0 ? 2.5 : -2.5;
                  mob.facingRight = dx > 0;
                } else {
                  mob.vx = mob.facingRight ? 1.5 : -1.5;
                }
              } else {
                mob.vx = mob.facingRight ? 1.5 : -1.5;
              }
            }
          } else {
            // Standard / Pack Aggro AI
            let targetPlayer: any = null;
            if (mob.targetPlayerId && room.players[mob.targetPlayerId]) {
              targetPlayer = room.players[mob.targetPlayerId];
            } else {
              // Pack detection range: 180px
              let nearestDist = 180;
              for (const pId in room.players) {
                const p = room.players[pId];
                const d = Math.hypot(p.x - mob.x, p.y - mob.y);
                if (d < nearestDist) {
                  nearestDist = d;
                  targetPlayer = p;
                  mob.targetPlayerId = pId;
                }
              }
            }

            if (targetPlayer) {
              const dx = targetPlayer.x - mob.x;
              const dist = Math.hypot(dx, targetPlayer.y - mob.y);
              if (dist < 260) {
                mob.vx = dx > 0 ? 3.2 : -3.2;
                mob.facingRight = dx > 0;
              } else {
                mob.targetPlayerId = null; // target escaped
                mob.vx = mob.facingRight ? 2 : -2;
              }
            } else {
              mob.vx = mob.facingRight ? 2 : -2;
            }
          }
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
           const typesNight = ['skeleton', 'creeper', 'zombie', 'wolf'];
           const typesDay = ['slime', 'wolf', 'giant_wolf'];
           type = isNight ? typesNight[Math.floor(Math.random() * typesNight.length)] : typesDay[Math.floor(Math.random() * typesDay.length)];
        }
        
        const mobId = 'mob_' + Date.now() + Math.floor(Math.random()*1000);
        room.mobs[mobId] = {
          id: mobId,
          type: type,
          x: spawnX * 32,
          y: (spawnY - (type === 'golem_boss' ? 4 : 2)) * 32,
          vx: 0, vy: 0, 
          hp: type === 'golem_boss' ? 300 : type === 'giant_wolf' ? 35 : type === 'wolf' ? 18 : 10, 
          maxHp: type === 'golem_boss' ? 300 : type === 'giant_wolf' ? 35 : type === 'wolf' ? 18 : 10,
          facingRight: Math.random() > 0.5
        };
        mobsUpdated = true;
      }

      if (mobsUpdated) {
        io.to(roomId).emit('mobs_update', room.mobs);
      }
    }
  }, 50);

  // Verify identity at the socket handshake. A presented token is verified;
  // if verification fails, fallback to guest connection rather than abruptly terminating
  // the websocket connection (which leaves the client stuck on the sky loading screen).
  io.use(async (socket, next) => {
    const token = (socket.handshake as any).auth?.token;
    if (typeof token === 'string' && token.length > 0) {
      try {
        const identity = await authenticator.tryAuthenticate(token);
        if (!identity) {
          console.warn(`[Socket Auth] Token verification returned null for socket ${socket.id}; proceeding as guest`);
          socket.data.identity = null;
        } else {
          socket.data.identity = identity;
        }
      } catch (err: any) {
        console.warn(`[Socket Auth] Token error for socket ${socket.id}: ${err?.message}; proceeding as guest`);
        socket.data.identity = null;
      }
    } else {
      socket.data.identity = null;
    }
    next();
  });

  io.on('connection', (socket) => {
    let currentRoom: string | null = null;

    socket.on('join_room', async (data: { roomId: string, nickname?: string, uid?: string, email?: string, profileId?: string } | string) => { 
      const roomId = typeof data === 'string' ? data : data.roomId; 
      const nickname = typeof data === 'string' ? 'Player' : (data.nickname || 'Player');
      const profileId = typeof data === 'string' ? undefined : data.profileId;

      // Identity comes exclusively from the verified token. Client-asserted
      // emails are ignored; a claimed uid that contradicts the token rejects.
      const identity = (socket.data.identity as SocketIdentity | null) || null;
      const claimedUid = typeof data === 'string' ? undefined : data.uid;
      if (claimedUid && identity && claimedUid !== identity.uid) {
        socket.emit('auth_error', { reason: 'identity mismatch' });
        return;
      }
      // Only the verified uid is ever recorded — guest-claimed uids are
      // dropped so unauthenticated sockets cannot address other accounts'
      // characters (e.g. through trades).
      const uid = identity?.uid;
      const isAdmin = identity?.isAdmin ?? false;
      console.log(`Player joining: nickname=${nickname}, uid=${uid ?? 'guest'}, isAdmin=${isAdmin}`);
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
        activeRooms[roomId] = createInitialRoom(roomId);
        await loadRoomPersistentState(roomId, activeRooms[roomId]);
      }

      const roomCreatedAt = (activeRooms[roomId] as any).createdAt;

      // Calculate guaranteed safe ground spawn (avoids floating roofs, sky, void)
      const safeSpawn = getSafeSpawnPoint(activeRooms[roomId].world);
      let startX = safeSpawn.x;
      let startY = safeSpawn.y;
      if (typeof data !== 'string' && typeof (data as any).x === 'number' && typeof (data as any).y === 'number') {
        const reqX = (data as any).x;
        const reqY = (data as any).y;
        const reqTx = Math.floor(reqX / 32);
        const reqTy = Math.floor(reqY / 32);
        const w = activeRooms[roomId].world;
        if (reqTx > 2 && reqTx < w.length - 2 && reqTy > 2 && reqTy < w[0].length - 2) {
          // Verify solid ground exists within 6 tiles below to prevent spawning in sky
          let groundFound = false;
          for (let dy = 0; dy <= 6; dy++) {
            if (w[reqTx] && w[reqTx][reqTy + dy] && w[reqTx][reqTy + dy] !== 0) {
              groundFound = true;
              break;
            }
          }
          if (groundFound) {
            startX = reqX;
            startY = reqY;
          }
        }
      }

      // Add player to room
      activeRooms[roomId].players[socket.id] = { 
        id: socket.id, 
        name: nickname, 
        x: startX, 
        y: startY, 
        facingRight: true, 
        vx: 0, 
        vy: 0, 
        uid, 
        profileId, 
        isAdmin,
        race: typeof data !== 'string' && (data as any).race ? (data as any).race : 'human',
        playerClass: typeof data !== 'string' && (data as any).playerClass ? (data as any).playerClass : 'warrior',
        skin: typeof data !== 'string' && (data as any).skin ? (data as any).skin : 'orange'
      };

      // Chunk-Based World Loading: Stream compressed 32x32 chunks around player spawn
      const spawnCx = Math.max(0, Math.min(CHUNK_COLS - 1, Math.floor(startX / (CHUNK_SIZE * 32))));
      const spawnCy = Math.max(0, Math.min(CHUNK_ROWS - 1, Math.floor(startY / (CHUNK_SIZE * 32))));
      const initialChunks: Array<{ cx: number; cy: number; data: Uint8Array }> = [];
      for (let cx = Math.max(0, spawnCx - 5); cx <= Math.min(CHUNK_COLS - 1, spawnCx + 5); cx++) {
        for (let cy = Math.max(0, spawnCy - 3); cy <= Math.min(CHUNK_ROWS - 1, spawnCy + 3); cy++) {
          const chunkData = getRoomChunk(activeRooms[roomId], cx, cy);
          if (chunkData) {
            initialChunks.push({ cx, cy, data: chunkData });
          }
        }
      }

      // Chunks travel as ONE binary attachment (manifest + blob): a packet with
      // more than 10 binary attachments is rejected by socket.io-parser
      // ("too many attachments"), which used to disconnect clients on join and
      // leave them stuck on the "Entering Realm" loading screen forever.
      const packedInit = packChunkBatch(initialChunks);

      // Send the compressed chunks and initial game state to the new user
      socket.emit('init_world', {
        chunkManifest: packedInit.manifest,
        chunkBlob: packedInit.blob,
        chunkSize: CHUNK_SIZE,
        worldWidth: WORLD_WIDTH,
        worldHeight: WORLD_HEIGHT,
        players: activeRooms[roomId].players,
        mobs: activeRooms[roomId].mobs,
        items: activeRooms[roomId].items,
        protectedBlocks: activeRooms[roomId].protectedBlocks || {},
        id: socket.id,
        roomCreatedAt: roomCreatedAt
      });
      
      // Tell others in the room about the new player
      socket.to(roomId).emit('player_joined', activeRooms[roomId].players[socket.id]);
    });

    socket.on('request_chunks', (data: { chunks: Array<{ cx: number; cy: number }> }) => {
      if (!currentRoom || !activeRooms[currentRoom] || !Array.isArray(data?.chunks)) return;
      const room = activeRooms[currentRoom];
      const chunksToSend: Array<{ cx: number; cy: number; data: Uint8Array }> = [];
      for (const req of data.chunks.slice(0, 40)) {
        if (typeof req?.cx === 'number' && typeof req?.cy === 'number') {
          const chunkData = getRoomChunk(room, req.cx, req.cy);
          if (chunkData) {
            chunksToSend.push({ cx: req.cx, cy: req.cy, data: chunkData });
          }
        }
      }
      const packedRequest = packChunkBatch(chunksToSend);
      socket.emit('chunks_data', { chunkManifest: packedRequest.manifest, chunkBlob: packedRequest.blob });
    });

socket.on('open_chest', async (data: { tx: number, ty: number }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const chestKey = `${data.tx}_${data.ty}`;
      if (!activeRooms[currentRoom].chests[chestKey]) {
        try {
          const chestDoc = await db.collection('rooms').doc(currentRoom).collection('chests').doc(chestKey).get();
          if (chestDoc.exists) {
            activeRooms[currentRoom].chests[chestKey] = sanitizeInventoryPayload(chestDoc.data()?.inventory, CHEST_SIZE);
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
      // Chests are shared world state; never trust the client payload shape.
      const inventory = sanitizeInventoryPayload(data.inventory, CHEST_SIZE);
      activeRooms[currentRoom].chests[chestKey] = inventory;
      socket.to(currentRoom).emit('chest_updated', { tx: data.tx, ty: data.ty, inventory });
      db.collection('rooms').doc(currentRoom).collection('chests').doc(chestKey).set({
        inventory: JSON.stringify(inventory),
        updatedAt: Date.now()
      }).catch(console.error);
    });

    socket.on('spawn_item', (data: { type: number, x: number, y: number, vx?: number, vy?: number }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      // Spawning free items is an admin power, verified from the token.
      const identity = (socket.data.identity as SocketIdentity | null) || null;
      if (!identity?.isAdmin) return;
      if (!Number.isFinite(data?.type) || !Number.isFinite(data?.x) || !Number.isFinite(data?.y)) return;
      const clean = sanitizeSlot({ type: data.type, count: 1 });
      if (!clean) return;
      const id = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      activeRooms[currentRoom].items[id] = { id, type: clean.type, x: data.x, y: data.y, vx: data.vx || 0, vy: data.vy || 0 };
    });

    socket.on('collect_item', (id: string) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const room = activeRooms[currentRoom];
      const player = room.players[socket.id];
      const item = room.items[id];
      if (item && player) {
        // Pickups require the player to actually stand near the drop.
        const dist = Math.hypot(item.x - player.x, item.y - player.y);
        if (!Number.isFinite(dist) || dist > 96) return;
        const type = item.type;
        delete room.items[id];
        io.to(currentRoom).emit('item_collected', { id, type, playerId: socket.id });
      }
    });

    
    
socket.on('sync_stats', (data: { skills?: { strength?: number; dexterity?: number; intelligence?: number }, hp?: number, maxHp?: number, mana?: number, maxMana?: number, level?: number }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const player = activeRooms[currentRoom].players[socket.id];
      if (!player) return;
      if (data.skills) player.skills = data.skills;
      if (data.hp !== undefined) player.hp = data.hp;
      if (data.maxHp !== undefined) player.maxHp = data.maxHp;
      if (data.mana !== undefined) player.mana = data.mana;
      if (data.maxMana !== undefined) player.maxMana = data.maxMana;
      if (data.level !== undefined) player.level = data.level;
    });

    socket.on('chat_message', (payload: any) => {
      if (!currentRoom) return;
      const room = activeRooms[currentRoom];
      const player = room?.players[socket.id];
      if (!player) return;

      const message = typeof payload === 'string' ? payload : (payload?.message || payload?.text || '');
      const rawChannel = typeof payload === 'object' && payload?.channel ? payload.channel : 'zone';

      // ---- Admin-only commands ----
      if (message.startsWith('/give ') || message.startsWith('/give_sp ') || message.startsWith('/give_xp ') || message.startsWith('/give_level ') || message.startsWith('/mob ')) {
        if (!player.isAdmin) {
          socket.emit('chat_message', { id: 'system', name: 'System', sender: 'System', text: '⛔ You do not have permission to use this command.', channel: 'system' });
          return;
        }

        const parts = message.split(' ');

        if (message.startsWith('/give ')) {
          const typeId = parseInt(parts[1]);
          const count = parts[2] ? parseInt(parts[2]) : 1;
          if (!isNaN(typeId)) {
            const itemId = 'item_' + Date.now() + '_' + Math.floor(Math.random()*1000);
            room.items[itemId] = { id: itemId, type: typeId, count, x: player.x, y: player.y - 32, vx: 0, vy: -3, spawnTime: Date.now() };
            socket.emit('chat_message', { id: 'system', name: 'System', sender: 'System', text: `✅ Spawned item ${typeId} x${count}.`, channel: 'system' });
          }
        } else if (message.startsWith('/give_sp ')) {
          const amount = parseInt(parts[1]) || 1;
          socket.emit('give_sp', amount);
          socket.emit('chat_message', { id: 'system', name: 'System', sender: 'System', text: `✅ Granted ${amount} Skill Points.`, channel: 'system' });
        } else if (message.startsWith('/give_xp ')) {
          const amount = parseInt(parts[1]) || 100;
          socket.emit('give_xp', amount);
          socket.emit('chat_message', { id: 'system', name: 'System', sender: 'System', text: `✅ Granted ${amount} XP.`, channel: 'system' });
        } else if (message.startsWith('/give_level ')) {
          const amount = parseInt(parts[1]) || 1;
          socket.emit('give_level', amount);
          socket.emit('chat_message', { id: 'system', name: 'System', sender: 'System', text: `✅ Granted ${amount} levels.`, channel: 'system' });
        } else if (message.startsWith('/mob ')) {
          const mobType = parts[1] || 'slime';
          const mobId = 'mob_admin_' + Date.now();
          room.mobs[mobId] = { id: mobId, type: mobType, x: player.x + 64, y: player.y, vx: 0, vy: 0, hp: mobType === 'golem_boss' ? 300 : 10, maxHp: mobType === 'golem_boss' ? 300 : 10, facingRight: false };
          io.to(currentRoom).emit('mobs_update', room.mobs);
          socket.emit('chat_message', { id: 'system', name: 'System', sender: 'System', text: `✅ Spawned mob: ${mobType}.`, channel: 'system' });
        }
        return;
      }
      
      if (message.startsWith('/spawn')) {
         const safeSpawn = getSafeSpawnPoint(room.world);
         socket.emit('teleport', { x: safeSpawn.x, y: safeSpawn.y });
         socket.emit('chat_message', { id: 'system', name: 'System', sender: 'System', text: `Teleported to spawn.`, channel: 'system' });
         return;
      }

      if (message.startsWith('/w ') || message.startsWith('/whisper ')) {
        const parts = message.split(' ');
        if (parts.length >= 3) {
           const targetName = parts[1].toLowerCase();
           const whisperMsg = parts.slice(2).join(' ');
           
           let targetSocketId = null;
           let actualTargetName = '';
           
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
              io.to(targetSocketId).emit('chat_message', { id: socket.id, name: player.name, sender: player.name, text: `(Whisper from ${player.name}): ${whisperMsg}`, channel: 'party', timestamp: Date.now() });
              socket.emit('chat_message', { id: socket.id, name: player.name, sender: player.name, text: `(Whisper to ${actualTargetName}): ${whisperMsg}`, channel: 'party', timestamp: Date.now() });
           } else {
              socket.emit('chat_message', { id: 'system', name: 'System', sender: 'System', text: `Player ${parts[1]} not found or offline.`, channel: 'system' });
           }
        }
      } else {
        // Channel classification
        let channel = rawChannel;
        let cleanText = message;
        if (message.startsWith('/p ') || message.startsWith('/party ')) {
          channel = 'party';
          cleanText = message.replace(/^\/(p|party)\s+/, '');
        } else if (message.startsWith('/t ') || message.startsWith('/trade ')) {
          channel = 'trade';
          cleanText = message.replace(/^\/(t|trade)\s+/, '');
        } else if (message.startsWith('/z ') || message.startsWith('/zone ')) {
          channel = 'zone';
          cleanText = message.replace(/^\/(z|zone)\s+/, '');
        }

        io.to(currentRoom).emit('chat_message', { 
          id: socket.id, 
          name: player.name, 
          sender: player.name, 
          text: cleanText, 
          message: cleanText, 
          channel: channel || 'zone', 
          timestamp: Date.now() 
        });
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
        if ((data as any).race) (player as any).race = (data as any).race;
        if ((data as any).playerClass) (player as any).playerClass = (data as any).playerClass;


        
        // Broadcast to everyone else
        socket.to(currentRoom).emit('player_moved', { id: socket.id, ...data });
      }
    });

    socket.on('block_update', (data: { tx: number, ty: number, blockType: number }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const room = activeRooms[currentRoom];
      const { world, players } = room;
      const player = players[socket.id];
      if (!player) return;

      const blockKey = `${data.tx}_${data.ty}`;
      const protectedInfo = room.protectedBlocks?.[blockKey];

      // Indestructible protection check for party owners / parties
      if (protectedInfo) {
        const isPartyMember = 
          (player.partyId && player.partyId === protectedInfo.partyId) || 
          socket.id === protectedInfo.leaderId;
        
        if (!isPartyMember) {
          socket.emit('action_rejected', { 
            reason: `Indestructible! Block is protected by party of ${protectedInfo.ownerName}.` 
          });
          // Roll back / preserve the protected block on client
          socket.emit('world_updated', { tx: data.tx, ty: data.ty, blockType: world[data.tx][data.ty] });
          return;
        }
      }

      // World edits must originate near the player; AdminBrick is admin-only.
      const identity = (socket.data.identity as SocketIdentity | null) || null;
      const verdict = validateBlockEdit({
        playerX: player.x, playerY: player.y,
        tx: data.tx, ty: data.ty, blockType: data.blockType,
        isAdmin: identity?.isAdmin ?? false,
        worldWidth: world.length, worldHeight: world[0].length,
      });
      if (!verdict.ok) {
        if (world[data.tx] && world[data.tx][data.ty] !== undefined) {
          socket.emit('world_updated', { tx: data.tx, ty: data.ty, blockType: world[data.tx][data.ty] });
        }
        return;
      }

      world[data.tx][data.ty] = data.blockType;
      invalidateRoomChunk(room, data.tx, data.ty);

      // Update protected blocks tracking
      if (data.blockType === 0) {
        if (room.protectedBlocks?.[blockKey]) {
          delete room.protectedBlocks[blockKey];
          io.to(currentRoom).emit('block_protection_removed', { tx: data.tx, ty: data.ty });
        }
      } else {
        // If player has party protection mode active, protect newly placed blocks
        if (player.partyProtectionEnabled && player.partyId) {
          if (!room.protectedBlocks) room.protectedBlocks = {};
          room.protectedBlocks[blockKey] = {
            partyId: player.partyId,
            leaderId: socket.id,
            ownerName: player.name || 'Party Leader'
          };
          io.to(currentRoom).emit('block_protection_set', {
            tx: data.tx,
            ty: data.ty,
            partyId: player.partyId,
            ownerName: player.name || 'Party Leader'
          });
        }
      }

      // Record modified blocks and flag room dirty for 100ms state saver
      if (!room.modifiedBlocks) room.modifiedBlocks = {};
      room.modifiedBlocks[blockKey] = data.blockType;
      room.dirty = true;

      // Broadcast to everyone else in room (sender predicts locally)
      socket.to(currentRoom).emit('world_updated', data);
    });

    socket.on('set_party_block_protection', (data: { enabled: boolean }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const room = activeRooms[currentRoom];
      const player = room.players[socket.id];
      if (!player) return;
      player.partyProtectionEnabled = !!data.enabled;
      socket.emit('party_block_protection_state', { enabled: player.partyProtectionEnabled });
    });

    socket.on('protect_targeted_block', (data: { tx: number, ty: number }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const room = activeRooms[currentRoom];
      const player = room.players[socket.id];
      if (!player) return;

      const blockKey = `${data.tx}_${data.ty}`;
      if (!room.protectedBlocks) room.protectedBlocks = {};

      if (room.protectedBlocks[blockKey]) {
        // Toggle off if already protected by this party
        if (room.protectedBlocks[blockKey].partyId === player.partyId || room.protectedBlocks[blockKey].leaderId === socket.id) {
          delete room.protectedBlocks[blockKey];
          room.dirty = true;
          io.to(currentRoom).emit('block_protection_removed', { tx: data.tx, ty: data.ty });
        }
      } else {
        // Protect block for party
        const partyId = player.partyId || ('party_' + socket.id);
        room.protectedBlocks[blockKey] = {
          partyId,
          leaderId: socket.id,
          ownerName: player.name || 'Party Leader'
        };
        room.dirty = true;
        io.to(currentRoom).emit('block_protection_set', {
          tx: data.tx,
          ty: data.ty,
          partyId,
          ownerName: player.name || 'Party Leader'
        });
      }
    });

    
    socket.on('fire_projectile', (data: { type: string, x: number, y: number, vx: number, vy: number, damage?: number }) => {
        if (!currentRoom || !activeRooms[currentRoom]) return;
        const room = activeRooms[currentRoom];
        const player = room.players[socket.id];
        if (!player) return;

        // Damage, lifetime and speed are server-authoritative; the client's
        // claimed values are clamped or ignored entirely.
        const clean = sanitizeProjectile(data, { x: player.x, y: player.y });
        if (!clean) return;

        // Server-Side Stat Scaling for Projectiles:
        // Dexterity authoritatively scales arrow/physical projectiles; Intelligence scales magical spells.
        let scaledDamage = clean.damage;
        if (clean.type === 'arrow' || clean.type === 'poison_arrow' || clean.type === 'bullet') {
          scaledDamage += Math.floor((player.skills?.dexterity || 0) * 1.5);
        } else if (clean.type === 'fireball' || clean.type === 'frostbolt' || clean.type === 'arcane_blast') {
          scaledDamage += Math.floor((player.skills?.intelligence || 0) * 2.0);
        }

        const pId = 'proj_' + Math.random().toString(36).substr(2, 9);
        room.projectiles[pId] = { id: pId, ownerId: socket.id, ...clean, damage: scaledDamage };
    });


    socket.on('grapple_pull', (data: { targetId: string, hx: number, hy: number }) => {
      if (currentRoom) {
         io.to(data.targetId).emit('grappled', { hx: data.hx, hy: data.hy });
      }
    });

    socket.on('hit_player', (data: { targetId: string, damage: number, facingRight: boolean }) => {
      if (currentRoom && activeRooms[currentRoom]) {
        const room = activeRooms[currentRoom];
        const attacker = room.players[socket.id];
        const targetPlayer = room.players[data.targetId];
        if (!attacker || !targetPlayer) return;

        const now = Date.now();
        const verdict = validateMeleeHit({
          attackerX: attacker.x, attackerY: attacker.y,
          targetX: targetPlayer.x, targetY: targetPlayer.y,
          claimedDamage: data.damage, now, lastHitAt: attacker.lastHitAt,
        });
        if (!verdict.ok) return;
        attacker.lastHitAt = now;

        // Server-side strength scaling bonus
        const strBonus = Math.floor((attacker.skills?.strength || 0) * 2);
        const finalDamage = Math.min(60, verdict.damage + strBonus);

        // Apply damage locally on their client
        io.to(data.targetId).emit('take_damage', { amount: finalDamage, facingRight: data.facingRight });
        // Emit damage indicator
        io.to(currentRoom).emit('damage_indicator', {
            id: Math.random().toString(),
            x: targetPlayer.x,
            y: targetPlayer.y,
            damage: finalDamage, isPlayer: true
        });
      }
    });

    socket.on('hit_mob', (data: { mobId: string, damage: number, facingRight: boolean, playerId?: string }) => {
      if (currentRoom && activeRooms[currentRoom]) {
        const room = activeRooms[currentRoom];
        const attacker = room.players[socket.id];
        const primaryMob = room.mobs[data.mobId];
        if (!attacker || !primaryMob) return;

        const now = Date.now();
        const verdict = validateMeleeHit({
          attackerX: attacker.x, attackerY: attacker.y,
          targetX: primaryMob.x, targetY: primaryMob.y,
          claimedDamage: data.damage, now, lastHitAt: attacker.lastHitAt,
        });
        if (!verdict.ok) return;
        attacker.lastHitAt = now;

        // Server-Side Stat Scaling for Melee (strength bonus authoritative calculation)
        const strBonus = Math.floor((attacker.skills?.strength || 0) * 2);
        const finalDamage = Math.min(60, verdict.damage + strBonus);

        const hitX = primaryMob.x;
        const hitY = primaryMob.y;
        const splashRadius = 64; // ~2 blocks splash damage

        // Pack aggro: alert attacked mob and all nearby pack members within 240px
        primaryMob.targetPlayerId = socket.id;
        for (const mId in room.mobs) {
          const m = room.mobs[mId];
          const distToHit = Math.hypot(m.x - hitX, m.y - hitY);
          if (distToHit <= 240) {
            m.targetPlayerId = socket.id;
          }
          if (distToHit <= splashRadius) {
            m.hp -= finalDamage;
            m.vy = -6;
            m.vx = (m.x > hitX) ? 8 : (m.x < hitX) ? -8 : (data.facingRight ? 8 : -8);
            m.lastHitBy = socket.id; // Always use authoritative socket.id
            
            // Emit damage indicator
            io.to(currentRoom).emit('damage_indicator', { 
              id: Math.random().toString(), 
              x: m.x, 
              y: m.y, 
              damage: finalDamage, isPlayer: false 
            });
          }
        }
      }
    });

    socket.on('tame_mob', (data: { mobId: string, itemType: number }) => {
      if (currentRoom && activeRooms[currentRoom]) {
        const room = activeRooms[currentRoom];
        const player = room.players[socket.id];
        const mob = room.mobs[data.mobId];
        if (!player || !mob) return;

        // Wolf can be tamed with Bone (403), RawMeat (211), or CookedMeat (212)
        if (mob.type === 'wolf' || mob.type === 'giant_wolf') {
          if (data.itemType === 403 || data.itemType === 211 || data.itemType === 212) {
            mob.tameCount = (mob.tameCount || 0) + 1;
            mob.hp = Math.min(mob.maxHp, mob.hp + 12);
            
            // Emit hearts effect
            io.to(currentRoom).emit('mob_tame_progress', {
              mobId: mob.id,
              x: mob.x,
              y: mob.y,
              tameCount: mob.tameCount,
              success: mob.tameCount >= 2
            });

            if (mob.tameCount >= 2 && !mob.ownerId) {
              mob.ownerId = socket.id;
              mob.ownerName = player.name || 'Champion';
              mob.type = 'giant_wolf';
              mob.maxHp = 50;
              mob.hp = 50;
              
              io.to(currentRoom).emit('chat_message', {
                sender: 'SYSTEM',
                text: `${player.name || 'A player'} has tamed a majestic Giant Wolf Mount!`
              });
              io.to(currentRoom).emit('mobs_update', room.mobs);
            }
          }
        }
      }
    });

    socket.on('mount_mob', (data: { mobId?: string, isMounting: boolean, mountType?: 'wolf' | 'minecart' }) => {
      if (currentRoom && activeRooms[currentRoom]) {
        const room = activeRooms[currentRoom];
        const player = room.players[socket.id];
        if (!player) return;

        (player as any).mounted = data.isMounting;
        (player as any).mountedMobId = data.isMounting ? data.mobId : null;
        (player as any).mountType = data.mountType || 'wolf';

        socket.to(currentRoom).emit('player_mount_updated', {
          playerId: socket.id,
          mounted: data.isMounting,
          mountedMobId: data.isMounting ? data.mobId : null,
          mountType: data.mountType || 'wolf'
        });
      }
    });

    socket.on('use_ability', (data: { ability: string, targetId?: string, targetType?: string, facingRight?: boolean, mouseX?: number, mouseY?: number }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const room = activeRooms[currentRoom];
      const player = room.players[socket.id];
      if (!player) return;

      // Reject unknown abilities and enforce server-side cooldowns.
      if (!isKnownAbility(data.ability)) return;
      const now = Date.now();
      player.abilityCooldowns = player.abilityCooldowns || {};
      if (!canUseAbility(data.ability, player.abilityCooldowns[data.ability], now)) return;
      player.abilityCooldowns[data.ability] = now;

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
      } else if (data.ability === 'fireball') {
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'slash' });
          const id = 'fb_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          let vx = data.facingRight ? 12 : -12;
          let vy = -0.5;
          if (data.targetId && data.targetType) {
              const targetObj = data.targetType === 'mob' ? room.mobs[data.targetId] : room.players[data.targetId];
              if (targetObj) {
                  const dx = targetObj.x - player.x;
                  const dy = targetObj.y - player.y;
                  const dist = Math.hypot(dx, dy) || 1;
                  vx = (dx / dist) * 12;
                  vy = (dy / dist) * 12;
              }
          } else if (data.mouseX !== undefined && data.mouseY !== undefined) {
              const dx = data.mouseX - player.x;
              const dy = data.mouseY - player.y;
              const dist = Math.hypot(dx, dy) || 1;
              vx = (dx / dist) * 12;
              vy = (dy / dist) * 12;
          }
          room.projectiles[id] = {
              id,
              type: 'fireball',
              owner: socket.id,
              x: player.x + (vx > 0 ? 16 : -16),
              y: player.y - 4,
              vx,
              vy,
              damage: 30 + Math.floor((player.skills?.intelligence || 0) * 2.0),
              life: 120
          };
      } else if (data.ability === 'frostbolt') {
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'slash' });
          const id = 'frost_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          let vx = data.facingRight ? 11 : -11;
          let vy = -0.3;
          if (data.targetId && data.targetType) {
              const targetObj = data.targetType === 'mob' ? room.mobs[data.targetId] : room.players[data.targetId];
              if (targetObj) {
                  const dx = targetObj.x - player.x;
                  const dy = targetObj.y - player.y;
                  const dist = Math.hypot(dx, dy) || 1;
                  vx = (dx / dist) * 11;
                  vy = (dy / dist) * 11;
              }
          } else if (data.mouseX !== undefined && data.mouseY !== undefined) {
              const dx = data.mouseX - player.x;
              const dy = data.mouseY - player.y;
              const dist = Math.hypot(dx, dy) || 1;
              vx = (dx / dist) * 11;
              vy = (dy / dist) * 11;
          }
          room.projectiles[id] = {
              id,
              type: 'frostbolt',
              owner: socket.id,
              x: player.x + (vx > 0 ? 16 : -16),
              y: player.y - 4,
              vx,
              vy,
              damage: 22 + Math.floor((player.skills?.intelligence || 0) * 1.8),
              life: 120
          };
      } else if (data.ability === 'arcane_blast') {
          io.to(currentRoom).emit('player_anim', { id: socket.id, anim: 'slash' });
          const id = 'arcane_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          let vx = data.facingRight ? 13 : -13;
          let vy = -0.2;
          if (data.targetId && data.targetType) {
              const targetObj = data.targetType === 'mob' ? room.mobs[data.targetId] : room.players[data.targetId];
              if (targetObj) {
                  const dx = targetObj.x - player.x;
                  const dy = targetObj.y - player.y;
                  const dist = Math.hypot(dx, dy) || 1;
                  vx = (dx / dist) * 13;
                  vy = (dy / dist) * 13;
              }
          } else if (data.mouseX !== undefined && data.mouseY !== undefined) {
              const dx = data.mouseX - player.x;
              const dy = data.mouseY - player.y;
              const dist = Math.hypot(dx, dy) || 1;
              vx = (dx / dist) * 13;
              vy = (dy / dist) * 13;
          }
          room.projectiles[id] = {
              id,
              type: 'arcane_blast',
              owner: socket.id,
              x: player.x + (vx > 0 ? 16 : -16),
              y: player.y - 4,
              vx,
              vy,
              damage: 38 + Math.floor((player.skills?.intelligence || 0) * 2.2),
              life: 140
          };
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
           // Role is derived from membership — a third socket cannot touch a trade.
           const role = trade ? tradeRoleOf(trade, socket.id) : null;
           if (trade && role) {
               // Trade offers pass through the schema sanitizer: unknown item
               // types and forged counts never reach the Firestore swap.
               const index = Number(data.index);
               if (!Number.isInteger(index) || index < 0 || index >= trade.p1Items.length) return;
               const item = sanitizeSlot(data.item);
               if (role === 'p1') {
                   trade.p1Items[index] = item;
               } else {
                   trade.p2Items[index] = item;
               }
               trade.p1Confirm = false;
               trade.p2Confirm = false;
               io.to(trade.p1).emit('trade_updated', trade);
               io.to(trade.p2).emit('trade_updated', trade);
           }
       }
    });

    socket.on('toggle_trade_confirm', (data: { tradeId: string, role: 'p1'|'p2' }) => {
       if (currentRoom && activeRooms[currentRoom]) {
           const trade = activeRooms[currentRoom].trades[data.tradeId];
           const role = trade ? tradeRoleOf(trade, socket.id) : null;
           if (trade && role) {
               if (role === 'p1') trade.p1Confirm = !trade.p1Confirm;
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
           if (trade && tradeRoleOf(trade, socket.id)) {
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

    // Trades mutate stored characters, whose docs are client-writable; parse
    // every inventory through the schema sanitizer before touching it.
    const inventorySizes: Record<string, number> = { hotbar: 10, backpack: 27, leftActionBar: 10, rightActionBar: 10 };
    const inventories = ['hotbar', 'backpack', 'leftActionBar', 'rightActionBar'];
    const parseInventories = (data: any) => inventories.map(k => sanitizeSlots(data[k], inventorySizes[k]));

    try {
        await db.runTransaction(async (t) => {
            const p1Ref = db.doc(`users/${p1.uid}/characters_v2/${p1.profileId}`);
            const p2Ref = db.doc(`users/${p2.uid}/characters_v2/${p2.profileId}`);
            
            const p1Doc = await t.get(p1Ref);
            const p2Doc = await t.get(p2Ref);
            
            if (!p1Doc.exists || !p2Doc.exists) throw new Error("Profile not found");
            
            const p1Data = p1Doc.data();
            const p2Data = p2Doc.data();
            
            // Helper to deduct items
            const deductItems = (data: any, itemsToDeduct: any[]) => {
                let success = true;
                const parsed = parseInventories(data);
                
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
                const parsed = parseInventories(data);
                
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
