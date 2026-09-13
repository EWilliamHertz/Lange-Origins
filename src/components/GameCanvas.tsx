import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { BlockType, BlockColors, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, BlockHardness } from '../lib/constants';
import { World } from '../lib/world';
import { PlayerState, updatePhysics } from '../lib/physics';
import { computeLighting, LightMap } from '../lib/lighting';
import { Crosshair } from 'lucide-react';

interface GameProps {
  selectedBlock: BlockType | null;
  roomId: string;
  userId?: string;
  isInventoryOpen: boolean;
  onHealthChange: (health: number) => void;
  sendChatMsg?: {text: string, timestamp: number} | null;
  onChatMessage?: (msg: {sender: string, text: string}) => void;
  onBlockMined?: (blockType: BlockType) => void;
  onBlockPlaced?: (blockType: BlockType) => void;
  onInteract?: (blockType: BlockType, tx: number, ty: number) => void;
  onDepthChange?: (depth: number) => void;
  socketRef?: React.MutableRefObject<Socket | null>;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export default function Game({ selectedBlock, roomId, isInventoryOpen, onHealthChange, sendChatMsg, onChatMessage, onBlockMined, onBlockPlaced, onInteract, onDepthChange, socketRef }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  interface DamageText {
    id: string;
    x: number;
    y: number;
    damage: number;
    life: number;
    maxLife: number;
  }

  // Ref for mutable game state to avoid re-renders
  const gameState = useRef<{
    world: World;
    player: PlayerState;
    otherPlayers: Record<string, {x: number, y: number, vx: number, vy: number, facingRight: boolean}>;
    socket: Socket | null;
    myId: string | null;
    keys: Record<string, boolean>;
    mouseX: number;
    mouseY: number;
    mouseDown: boolean;
    cameraX: number;
    cameraY: number;
    lastTime: number;
    interactionCooldown: number;
    timeOfDay: number;
    particles: Particle[];
    miningProgress: number;
    miningTarget: { x: number, y: number } | null;
    lightMap: LightMap | null;
    lastLightTime: number;
    mobs: Record<string, any>;
    items: Record<string, any>;
    damageTexts: DamageText[];
  }>({
    world: [],
    player: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      width: TILE_SIZE * 0.8,
      height: TILE_SIZE * 1.5,
      grounded: false,
      facingRight: true,
      health: 10,
      maxHealth: 10,
      invulnerableTimer: 0
    },
    otherPlayers: {},
    socket: null,
    myId: null,
    keys: {},
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    rightMouseDown: false,
    cameraX: 0,
    cameraY: 0,
    lastTime: 0,
    interactionCooldown: 0,
    timeOfDay: 0.35, // Start in the morning
    particles: [],
    miningProgress: 0,
    miningTarget: null,
    lightMap: null,
    lastLightTime: 0,
    mobs: {},
    items: {},
    damageTexts: []
  });

  const [connected, setConnected] = useState(false);
  // Track window resize
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Init Socket connection
  useEffect(() => {
    // Only connect if not already connected
    if (gameState.current.socket) return;
    
    // Connect to same host, port 3000, forcing websocket for Cloud Run compatibility
    const socket = io({
      transports: ['websocket'],
      upgrade: false
    });
    gameState.current.socket = socket;
    if (socketRef) {
      socketRef.current = socket;
    }

    socket.on('connect', () => {
      socket.emit('join_room', roomId);
    });

    socket.on('kicked', (data: { reason: string }) => {
      alert(`You were kicked from the server: ${data.reason}`);
      window.location.reload();
    });

    socket.on('world_wiped', (data: { world: World }) => {
      gameState.current.world = data.world;
      gameState.current.items = {};
      gameState.current.mobs = {};
      gameState.current.lastLightTime = 0; // Force relight
    });

    socket.on('init_world', (data: { world: World, players: Record<string, any>, mobs?: Record<string, any>, id: string, roomCreatedAt?: number }) => {
      gameState.current.world = data.world;
      gameState.current.myId = data.id;
      
      if (data.mobs) {
        gameState.current.mobs = data.mobs;
      }
      
      // Initialize my spawn pos from the server's record
      const me = data.players[data.id];
      if (me) {
        if (gameState.current.player.x === 0 && gameState.current.player.y === 0) {
           gameState.current.player.x = me.x;
           gameState.current.player.y = me.y;
        } else {
           // We reconnected! Let the server know our actual local position instead of snapping to spawn
           socket.emit('player_update', {
             x: gameState.current.player.x,
             y: gameState.current.player.y,
             vx: gameState.current.player.vx,
             vy: gameState.current.player.vy,
             facingRight: gameState.current.player.facingRight,
             tool: propsRef.current.selectedBlock,
             isMining: false
           });
        }
      }

      // Populate other players
      const others = { ...data.players };
      delete others[data.id];
      gameState.current.otherPlayers = others;

      if (data.roomCreatedAt) {
        const elapsedMs = Date.now() - data.roomCreatedAt;
        gameState.current.timeOfDay = (0.35 + elapsedMs * 0.00001) % 1.0;
      }
      
      setConnected(true);
    });

    socket.on('player_joined', (player: any) => {
      gameState.current.otherPlayers[player.id] = player;
    });

    socket.on('player_left', (id: string) => {
      delete gameState.current.otherPlayers[id];
    });

    socket.on('player_moved', (player: any) => {
      if (gameState.current.otherPlayers[player.id]) {
        gameState.current.otherPlayers[player.id] = player;
      } else {
        gameState.current.otherPlayers[player.id] = player;
      }
    });

    socket.on('chat_message', (msg: {id: string, message: string}) => {
      if (onChatMessage) {
        onChatMessage({ sender: msg.id, text: msg.message });
      }
    });

    socket.on('world_updated', (data: { tx: number, ty: number, blockType: number }) => {
       const { tx, ty, blockType } = data;
       const currentBlock = gameState.current.world[tx][ty];
       gameState.current.world[tx][ty] = blockType;
       gameState.current.lastLightTime = 0; // force light map recalculation
       
       // Spawn breaking particles if the block was removed
       if (blockType === BlockType.Air && currentBlock !== BlockType.Air) {
          const blockColor = BlockColors[currentBlock];
          for (let i = 0; i < 8; i++) {
            gameState.current.particles.push({
              x: tx * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * TILE_SIZE,
              y: ty * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * TILE_SIZE,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 1) * 6,
              life: 1,
              maxLife: 20 + Math.random() * 20,
              color: blockColor,
              size: 4 + Math.random() * 4
            });
          }
       }
    });

    socket.on('mobs_update', (mobs: Record<string, any>) => {
      const current = gameState.current.mobs;
      for (const id in mobs) {
        if (current[id]) {
          current[id].targetX = mobs[id].x;
          current[id].targetY = mobs[id].y;
          current[id].hp = mobs[id].hp;
          current[id].facingRight = mobs[id].facingRight;
          current[id].type = mobs[id].type;
        } else {
          current[id] = mobs[id];
          current[id].targetX = mobs[id].x;
          current[id].targetY = mobs[id].y;
        }
      }
      for (const id in current) {
        if (!mobs[id]) delete current[id];
      }
    });

    socket.on('items_update', (items: Record<string, any>) => {
      gameState.current.items = items;
    });

    socket.on('item_collected', (data: { id: string, type: number, playerId: string }) => {
      if (gameState.current.items[data.id]) {
        delete gameState.current.items[data.id];
      }
      if (data.playerId === socket.id && propsRef.current.onBlockMined) {
        propsRef.current.onBlockMined(data.type);
      }
    });

    socket.on('damage_indicator', (data: { id: string, x: number, y: number, damage: number }) => {
      gameState.current.damageTexts.push({
        id: data.id,
        x: data.x,
        y: data.y,
        damage: data.damage,
        life: 0,
        maxLife: 60 // ~1 second at 60fps
      });
    });

    return () => {
      socket.disconnect();
      gameState.current.socket = null;
    };
  }, [roomId]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mutable refs to read latest props in game loop without restarting it
  const propsRef = useRef({ selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onDepthChange, onBlockPlaced });
  useEffect(() => {
    propsRef.current = { selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onDepthChange, onBlockPlaced };
  }, [selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onDepthChange, onBlockPlaced]);

  // Send chat messages when props change
  useEffect(() => {
    if (sendChatMsg && gameState.current.socket) {
       gameState.current.socket.emit('chat_message', sendChatMsg.text);
    }
  }, [sendChatMsg]);

  // Main game loop & Input hooks
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Input handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      gameState.current.keys[e.key.toLowerCase()] = true;
      if (['w','a','s','d',' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.current.keys[e.key.toLowerCase()] = false;
    };
    
    const updateMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Calculate mouse position relative to the canvas internal resolution
      gameState.current.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      gameState.current.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) gameState.current.mouseDown = true;
      if (e.button === 2) gameState.current.rightMouseDown = true;
      updateMousePos(e);
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) gameState.current.mouseDown = false;
      if (e.button === 2) gameState.current.rightMouseDown = false;
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    const handleMouseMove = (e: MouseEvent) => {
      if ((e.buttons & 1) === 0) {
        gameState.current.mouseDown = false;
      }
      updateMousePos(e);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('contextmenu', handleContextMenu);

    // Game Loop
    const loop = (timestamp: number) => {
      const dt = timestamp - gameState.current.lastTime;
      gameState.current.lastTime = timestamp;
      
      const state = gameState.current;
      const { player, world } = state;
      
      // Zero keys if inventory is open
      const keysToUse = propsRef.current.isInventoryOpen ? {} : state.keys;

      const prevHealth = player.health;
      
      // Update Physics
      if (world.length > 0 && !propsRef.current.isInventoryOpen) {
        const oldX = player.x;
        const oldY = player.y;
        updatePhysics(player, world, keysToUse);

        // Mob Touch Damage
        if (player.invulnerableTimer <= 0) {
           for (const mobId in state.mobs) {
              const mob = state.mobs[mobId];
              const pLeft = player.x; const pRight = player.x + player.width;
              const pTop = player.y; const pBottom = player.y + player.height;
              
              const mLeft = mob.x; const mRight = mob.x + 24;
              const mTop = mob.type === 'zombie' ? mob.y - 24 : mob.y - 12;
              const mBottom = mob.y + 24;
              
              const intersectX = pLeft < mRight && pRight > mLeft;
              const intersectY = pTop < mBottom && pBottom > mTop;
              
              if (intersectX && intersectY) {
                 player.health = Math.max(0, player.health - 1);
                 player.invulnerableTimer = 60; // 1 second i-frames
                 // Knockback
                 player.vy = -5;
                 player.vx = player.x < mob.x ? -5 : 5;
                 break;
              }
           }
        }

        // Emit depth change occasionally
        if (state.socket && Math.random() < 0.02 && propsRef.current.onDepthChange) {
           const surfaceLevel = Math.floor(WORLD_HEIGHT / 2.5);
           const depth = Math.floor(player.y / TILE_SIZE) - surfaceLevel;
           if (depth > 0) propsRef.current.onDepthChange(depth);
        }

        if (!state.lastSyncProps) {
           state.lastSyncProps = { isMining: false, tool: null };
        }
        
        const currentIsMining = state.miningProgress > 0 || state.interactionCooldown > 150;
        const currentTool = propsRef.current.selectedBlock;

        if (state.socket && (player.x !== oldX || player.y !== oldY || currentIsMining !== state.lastSyncProps.isMining || currentTool !== state.lastSyncProps.tool || Math.random() < 0.05)) {
           state.socket.emit('player_update', { 
             x: player.x, y: player.y, vx: player.vx, vy: player.vy, facingRight: player.facingRight,
             tool: currentTool, isMining: currentIsMining
           });
           state.lastSyncProps.isMining = currentIsMining;
           state.lastSyncProps.tool = currentTool;
        }
      }
      
      // Handle Death
      if (player.health <= 0) {
         const spawnX = Math.floor(WORLD_WIDTH / 2);
         let spawnY = 0;
         while(spawnY < WORLD_HEIGHT && world[spawnX]?.[spawnY] === BlockType.Air) {
           spawnY++;
         }
         player.x = spawnX * TILE_SIZE;
         player.y = (spawnY - 2) * TILE_SIZE;
         player.vx = 0;
         player.vy = 0;
         player.health = player.maxHealth;
         if (state.socket) {
           state.socket.emit('player_update', { 
             x: player.x, y: player.y, vx: 0, vy: 0, facingRight: player.facingRight,
             tool: propsRef.current.selectedBlock, isMining: false
           });
         }
      }

      if (player.health !== prevHealth) {
         propsRef.current.onHealthChange(player.health);
      }
      
      // Camera follow
      // Center the player on screen
      const targetCameraX = player.x + player.width / 2 - dimensions.width / 2;
      const targetCameraY = player.y + player.height / 2 - dimensions.height / 2;
      
      // Smooth camera interpolation
      state.cameraX += (targetCameraX - state.cameraX) * 0.1;
      state.cameraY += (targetCameraY - state.cameraY) * 0.1;

      // Clamp camera to world bounds (optional, but good)
      state.cameraX = Math.max(0, Math.min(state.cameraX, WORLD_WIDTH * TILE_SIZE - dimensions.width));
      state.cameraY = Math.max(0, Math.min(state.cameraY, WORLD_HEIGHT * TILE_SIZE - dimensions.height));

      // Handle mining/placing
      if (state.interactionCooldown > 0) {
         state.interactionCooldown -= dt;
      }
      
      // Update Time of Day
      state.timeOfDay = (state.timeOfDay + dt * 0.00002) % 1;
      
      const targetTx = Math.floor((state.cameraX + state.mouseX) / TILE_SIZE);
      const targetTy = Math.floor((state.cameraY + state.mouseY) / TILE_SIZE);
      
      const inBounds = targetTx >= 0 && targetTx < WORLD_WIDTH && targetTy >= 0 && targetTy < WORLD_HEIGHT;

      // Compute distance to target block for interaction range
      const playerCenterX = player.x + player.width / 2;
      const playerCenterY = player.y + player.height / 2;
      const targetCenterX = targetTx * TILE_SIZE + TILE_SIZE / 2;
      const targetCenterY = targetTy * TILE_SIZE + TILE_SIZE / 2;
      const dist = Math.sqrt(Math.pow(playerCenterX - targetCenterX, 2) + Math.pow(playerCenterY - targetCenterY, 2));
      
      const MAX_REACH = TILE_SIZE * 6; // 6 blocks reach

      if (!propsRef.current.isInventoryOpen && state.rightMouseDown && inBounds && state.interactionCooldown <= 0) {
        if (dist <= MAX_REACH) {
          const currentBlock = world[targetTx][targetTy];
          const selected = propsRef.current.selectedBlock;
          
          if ((selected === BlockType.WoodHoe || selected === BlockType.StoneHoe || selected === BlockType.IronHoe) && (currentBlock === BlockType.Grass || currentBlock === BlockType.Dirt)) {
             world[targetTx][targetTy] = BlockType.Farmland;
             if (state.socket) state.socket.emit('block_update', { tx: targetTx, ty: targetTy, blockType: BlockType.Farmland });
          } else if (selected === BlockType.CarrotSeed && currentBlock === BlockType.Farmland && world[targetTx][targetTy - 1] === BlockType.Air) {
             world[targetTx][targetTy - 1] = BlockType.CarrotCrop1;
             if (state.socket) state.socket.emit('block_update', { tx: targetTx, ty: targetTy - 1, blockType: BlockType.CarrotCrop1 });
             if (propsRef.current.onInteract) propsRef.current.onInteract(BlockType.CarrotSeed, targetTx, targetTy); // Will be used to remove seed from inventory
          } else if (currentBlock !== BlockType.Air && propsRef.current.onInteract) {
            propsRef.current.onInteract(currentBlock, targetTx, targetTy);
          }
          state.interactionCooldown = 300;
        }
      }

      if (!propsRef.current.isInventoryOpen && state.mouseDown && inBounds) {
        
        // 1. Check for mob hit first
        let hitMob = false;
        if (state.interactionCooldown <= 0) {
          const mx = state.cameraX + state.mouseX;
          const my = state.cameraY + state.mouseY;
          for (const mobId in state.mobs) {
             const mob = state.mobs[mobId];
             const mLeft = mob.x; const mRight = mob.x + 24;
             const mTop = mob.type === 'zombie' ? mob.y - 24 : mob.y - 12;
             const mBottom = mob.y + 24;
             
             if (mx >= mLeft && mx <= mRight && my >= mTop && my <= mBottom) {
                if (state.socket) {
                   const dmg = propsRef.current.selectedBlock === BlockType.IronSword ? 8
                            : propsRef.current.selectedBlock === BlockType.IronPickaxe ? 5
                            : propsRef.current.selectedBlock === BlockType.WoodSword ? 5
                            : propsRef.current.selectedBlock === BlockType.StonePickaxe ? 4 
                            : propsRef.current.selectedBlock === BlockType.WoodPickaxe ? 3 
                            : 1;
                   state.socket.emit('hit_mob', { mobId, damage: dmg, facingRight: player.x < mob.x });
                }
                state.interactionCooldown = 300; // Attack cooldown
                hitMob = true;
                break;
             }
          }
        }

        // 2. Block interaction if no mob hit and in reach
        if (!hitMob && dist <= MAX_REACH) {
          const currentBlock = world[targetTx][targetTy];
          
          // Block Placing (Ensure selectedBlock is not null)
          if (currentBlock === BlockType.Air && propsRef.current.selectedBlock !== null && propsRef.current.selectedBlock !== BlockType.Air && propsRef.current.selectedBlock !== BlockType.Fists && propsRef.current.selectedBlock < 100 && state.interactionCooldown <= 0) {
             // Prevent placing block inside player
             const pLeft = Math.floor(player.x / TILE_SIZE);
             const pRight = Math.floor((player.x + player.width - 0.1) / TILE_SIZE);
             const pTop = Math.floor(player.y / TILE_SIZE);
             const pBottom = Math.floor((player.y + player.height - 0.1) / TILE_SIZE);
             
             const intersectX = targetTx >= pLeft && targetTx <= pRight;
             const intersectY = targetTy >= pTop && targetTy <= pBottom;
             
             if (!(intersectX && intersectY)) {
               world[targetTx][targetTy] = propsRef.current.selectedBlock;
               state.interactionCooldown = 150; // 150ms cooldown for placing
               state.lastLightTime = 0; // force light update
               if (state.socket) {
                 state.socket.emit('block_update', { tx: targetTx, ty: targetTy, blockType: propsRef.current.selectedBlock });
               }
               if (propsRef.current.onBlockPlaced) {
                 propsRef.current.onBlockPlaced(propsRef.current.selectedBlock);
               }
             }
          } 
          // Block Breaking
        else if (currentBlock !== BlockType.Air) {
          // Check if we switched target
          if (!state.miningTarget || state.miningTarget.x !== targetTx || state.miningTarget.y !== targetTy) {
            state.miningTarget = { x: targetTx, y: targetTy };
            state.miningProgress = 0;
          }
          
          let toolMultiplier = 1;
          const selected = propsRef.current.selectedBlock;
          
          if (selected === BlockType.WoodPickaxe && BlockHardness[currentBlock] >= 2) toolMultiplier = 3;
          if (selected === BlockType.StonePickaxe && BlockHardness[currentBlock] >= 2) toolMultiplier = 6;
          if (selected === BlockType.IronPickaxe && BlockHardness[currentBlock] >= 2) toolMultiplier = 12;
          if ((selected === BlockType.WoodHoe || selected === BlockType.StoneHoe || selected === BlockType.IronHoe) && BlockHardness[currentBlock] === 1) toolMultiplier = 6;
          
          const hardness = BlockHardness[currentBlock] || 1;
          const timeRequired = hardness * 300; // 300ms per hardness unit
          
          state.miningProgress += dt * toolMultiplier;
          
          if (state.miningProgress >= timeRequired) {
            // Break it
            const blockColor = BlockColors[currentBlock];
            for (let i = 0; i < 8; i++) {
              state.particles.push({
                x: targetTx * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * TILE_SIZE,
                y: targetTy * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * TILE_SIZE,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 1) * 6,
                life: 1,
                maxLife: 20 + Math.random() * 20,
                color: blockColor,
                size: 4 + Math.random() * 4
              });
            }
            
            world[targetTx][targetTy] = BlockType.Air;
            state.miningProgress = 0;
            state.miningTarget = null;
            state.lastLightTime = 0; // force light update
            if (state.socket) {
               state.socket.emit('block_update', { tx: targetTx, ty: targetTy, blockType: BlockType.Air });
               // Custom drops
               if (currentBlock === BlockType.Grass && Math.random() < 0.2) {
                   state.socket.emit('spawn_item', { type: BlockType.CarrotSeed, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
               } else if (currentBlock === BlockType.CarrotCrop3) {
                   state.socket.emit('spawn_item', { type: BlockType.Carrot, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
                   if (Math.random() > 0.5) state.socket.emit('spawn_item', { type: BlockType.Carrot, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
               } else if (currentBlock === BlockType.Leaves && Math.random() < 0.1) {
                   state.socket.emit('spawn_item', { type: BlockType.Apple, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
               } else if (currentBlock === BlockType.Chest) {
                   state.socket.emit('spawn_item', { type: BlockType.Chest, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
                   // Note: To keep things simple in this prototype, items inside the chest are lost when broken
               }
            }
            if (propsRef.current.onBlockMined) {
              propsRef.current.onBlockMined(currentBlock);
            }
          }
        }
        } // close !hitMob block
      } else {
        // Reset mining progress if mouse is up or out of bounds
        state.miningProgress = 0;
        state.miningTarget = null;
      }

      // Draw Sky
      let bgColor1 = '#87CEEB';
      let bgColor2 = '#87CEEB';

      if (state.timeOfDay < 0.2 || state.timeOfDay > 0.8) { // Night
         bgColor1 = '#020617'; bgColor2 = '#0f172a';
      } else if (state.timeOfDay >= 0.2 && state.timeOfDay < 0.3) { // Sunrise
         bgColor1 = '#1e3a8a'; bgColor2 = '#f59e0b';
      } else if (state.timeOfDay >= 0.3 && state.timeOfDay < 0.7) { // Day
         bgColor1 = '#3b82f6'; bgColor2 = '#93c5fd';
      } else if (state.timeOfDay >= 0.7 && state.timeOfDay <= 0.8) { // Sunset
         bgColor1 = '#1e3a8a'; bgColor2 = '#ea580c';
      }

      const grad = ctx.createLinearGradient(0, 0, 0, dimensions.height);
      grad.addColorStop(0, bgColor1);
      grad.addColorStop(1, bgColor2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw Sun / Moon
      const cx = dimensions.width / 2;
      const cy = dimensions.height;
      const orbitRadius = dimensions.width * 0.45;
      
      // Map 0.2-0.8 (Daytime) to 0-PI (Sunrise to Sunset)
      if (state.timeOfDay > 0.2 && state.timeOfDay < 0.8) {
         const dayProgress = (state.timeOfDay - 0.2) / 0.6;
         const angle = Math.PI - dayProgress * Math.PI;
         const sunX = cx + Math.cos(angle) * orbitRadius;
         const sunY = cy - Math.sin(angle) * orbitRadius;
         
         ctx.fillStyle = '#fde047';
         ctx.beginPath();
         ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
         ctx.fill();
         // Sun glow
         ctx.fillStyle = 'rgba(253, 224, 71, 0.3)';
         ctx.beginPath();
         ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
         ctx.fill();
      } else {
         // Nighttime Moon
         let nightProgress = 0;
         if (state.timeOfDay >= 0.8) nightProgress = (state.timeOfDay - 0.8) / 0.4;
         if (state.timeOfDay <= 0.2) nightProgress = (state.timeOfDay + 0.2) / 0.4;
         
         const angle = Math.PI - nightProgress * Math.PI;
         const moonX = cx + Math.cos(angle) * orbitRadius;
         const moonY = cy - Math.sin(angle) * orbitRadius;
         
         ctx.fillStyle = '#f1f5f9';
         ctx.beginPath();
         ctx.arc(moonX, moonY, 30, 0, Math.PI * 2);
         ctx.fill();
      }
      
      ctx.save();
      ctx.translate(-Math.floor(state.cameraX), -Math.floor(state.cameraY));
      
      // Compute light map periodically or if it doesn't exist
      if (world.length > 0 && (!state.lightMap || timestamp - state.lastLightTime > 500)) {
         state.lightMap = computeLighting(world, state.timeOfDay);
         state.lastLightTime = timestamp;
      }
      
      // Draw Cave Background
      const surfaceLevel = Math.floor(WORLD_HEIGHT / 3);
      const caveStartY = surfaceLevel * TILE_SIZE;
      if (state.cameraY + dimensions.height > caveStartY) {
         ctx.fillStyle = '#1e1411'; // Darker dirt for bg
         ctx.fillRect(
           state.cameraX, 
           Math.max(state.cameraY, caveStartY), 
           dimensions.width, 
           dimensions.height
         );
      }
      
      // Draw world (visible tiles only)
      const startCol = Math.max(0, Math.floor(state.cameraX / TILE_SIZE));
      const endCol = Math.min(WORLD_WIDTH - 1, Math.floor((state.cameraX + dimensions.width) / TILE_SIZE));
      const startRow = Math.max(0, Math.floor(state.cameraY / TILE_SIZE));
      const endRow = Math.min(WORLD_HEIGHT - 1, Math.floor((state.cameraY + dimensions.height) / TILE_SIZE));

      if (world.length > 0 && state.lightMap) {
        // First draw the cave background shading based on lightmap (even for air blocks)
        for (let x = startCol; x <= endCol; x++) {
          for (let y = startRow; y <= endRow; y++) {
             const idx = x + y * WORLD_WIDTH;
             const lightLevel = state.lightMap[idx] || 0;
             const darkness = 1 - (lightLevel / 15);
             
             const block = world[x][y];
             
             if (block !== BlockType.Air) {
               // Draw base block
               if (block === BlockType.QuestNPC) {
                 // Draw a little character
                 ctx.fillStyle = '#F8BBD0'; // skin
                 ctx.beginPath();
                 ctx.arc(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/3, TILE_SIZE/4, 0, Math.PI * 2);
                 ctx.fill();
                 ctx.fillStyle = '#E91E63'; // shirt
                 ctx.fillRect(x * TILE_SIZE + TILE_SIZE/4, y * TILE_SIZE + TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/2);
               } else {
                 ctx.fillStyle = BlockColors[block];
                 ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                 
                 // Draw some internal texturing / borders to make it look like blocks
                 if (block !== BlockType.Leaves && block !== BlockType.Glass && block !== BlockType.Torch) {
                   ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                   ctx.lineWidth = 1;
                   ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                 }
                 
                 // Special Chest drawing
                 if (block === BlockType.Chest) {
                   // Outline
                   ctx.strokeStyle = '#3E2723';
                   ctx.lineWidth = 2;
                   ctx.strokeRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                   // Lock
                   ctx.fillStyle = '#9E9E9E';
                   ctx.fillRect(x * TILE_SIZE + TILE_SIZE / 2 - 2, y * TILE_SIZE + TILE_SIZE / 2 - 4, 4, 6);
                 }
               }
               
               // Special case: Grass gets a green top
               if (block === BlockType.Grass) {
                  ctx.fillStyle = '#4CAF50';
                  ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE * 0.25);
               }
             }

             // Apply darkness overlay
             if (darkness > 0) {
               ctx.fillStyle = `rgba(0, 0, 0, ${darkness * 0.9})`;
               ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
             }
          }
        }
      }

      // Update & Draw Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4; // Gravity
        p.life++;
        if (p.life >= p.maxLife) {
          state.particles.splice(i, 1);
          continue;
        }
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - (p.life / p.maxLife);
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1.0;

      const drawPlayer = (pX: number, pY: number, pVx: number, facingRight: boolean, colorBase: string, name: string, tool: BlockType | null = null, isMining: boolean = false) => {
        const pWidth = player.width;
        const pHeight = player.height;
        const isMoving = Math.abs(pVx) > 0.5;
        const walkCycle = isMoving ? Math.sin(timestamp * 0.015) * 5 : 0;
        
        // Back Leg
        ctx.fillStyle = colorBase === 'blue' ? '#0D47A1' : '#E65100'; // Darker base
        ctx.fillRect(
          pX + 4, 
          pY + pHeight - 8 + (isMoving ? -walkCycle : 0), 
          8, 
          10
        );
        
        // Front Leg
        ctx.fillRect(
          pX + pWidth - 12, 
          pY + pHeight - 8 + (isMoving ? walkCycle : 0), 
          8, 
          10
        );

        // Body (bobs slightly when walking)
        const bodyYOffset = isMoving ? Math.abs(walkCycle) * 0.3 : 0;
        ctx.fillStyle = colorBase === 'blue' ? '#2196F3' : '#FF9800'; 
        ctx.fillRect(pX, pY + bodyYOffset, pWidth, pHeight - 6);
        
        // Head
        ctx.fillStyle = colorBase === 'blue' ? '#64B5F6' : '#FFB74D'; 
        ctx.fillRect(pX - 2, pY - 12 + bodyYOffset, pWidth + 4, 16);

        // Eyes
        ctx.fillStyle = '#000';
        const eyeOffset = facingRight ? 14 : 4;
        const headY = pY - 6 + bodyYOffset;
        ctx.fillRect(pX - 2 + eyeOffset, headY, 4, 4);
        ctx.fillRect(pX - 2 + eyeOffset + 6, headY, 4, 4);

        // Front Arm (holding tool)
        const armY = pY + 4 + bodyYOffset;
        const armX = facingRight ? pX + pWidth - 6 : pX - 2;
        
        ctx.save();
        ctx.translate(armX + 4, armY + 4);
        
        let armRotation = 0;
        if (isMining) {
           // Swing animation
           armRotation = (Math.sin(timestamp * 0.03) * 0.8) - 0.4;
           if (!facingRight) armRotation = -armRotation;
        }
        ctx.rotate(armRotation);
        
        // Draw Arm
        ctx.fillStyle = colorBase === 'blue' ? '#1976D2' : '#F57C00';
        ctx.fillRect(-4, -4, 8, 16);
        
        // Draw Tool
        if (tool && tool !== BlockType.Fists && tool !== BlockType.Air) {
           ctx.translate(0, 10);
           const toolAngle = facingRight ? Math.PI / 4 : -Math.PI / 4;
           ctx.rotate(toolAngle);
           ctx.fillStyle = BlockColors[tool] || '#FFF';
           
           // Determine tool shape based on type
           const isSword = tool === BlockType.WoodSword || tool === BlockType.IronSword;
           const isPickaxe = tool === BlockType.WoodPickaxe || tool === BlockType.StonePickaxe || tool === BlockType.IronPickaxe;
           const isHoe = tool === BlockType.WoodHoe || tool === BlockType.StoneHoe || tool === BlockType.IronHoe;
           
           if (isSword) {
              // Sword shape
              ctx.fillStyle = '#8D6E63'; // Handle
              ctx.fillRect(-2, 0, 4, 12);
              ctx.fillStyle = BlockColors[tool]; // Blade
              ctx.fillRect(-3, -20, 6, 20);
              ctx.fillRect(-6, -2, 12, 3); // Crossguard
           } else if (isPickaxe) {
              // Pickaxe shape
              ctx.fillStyle = '#8D6E63'; // Handle
              ctx.fillRect(-2, 0, 4, 16);
              ctx.fillStyle = BlockColors[tool]; // Head
              ctx.fillRect(-10, -4, 20, 4);
              ctx.fillRect(-10, -2, 4, 4);
              ctx.fillRect(6, -2, 4, 4);
           } else if (isHoe) {
              // Hoe shape
              ctx.fillStyle = '#8D6E63'; // Handle
              ctx.fillRect(-2, 0, 4, 16);
              ctx.fillStyle = BlockColors[tool]; // Head
              ctx.fillRect(facingRight ? -2 : -8, -4, 10, 4);
           } else {
              // Normal block
              ctx.fillRect(-6, -6, 12, 12);
           }
        }
        
        ctx.restore();

        // Nametag
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = '10px sans-serif';
        const textWidth = ctx.measureText(name).width;
        ctx.fillRect(pX + pWidth/2 - textWidth/2 - 4, pY - 26 + bodyYOffset, textWidth + 8, 14);
        ctx.fillStyle = '#FFF';
        ctx.fillText(name, pX + pWidth/2 - textWidth/2, pY - 16 + bodyYOffset);
      };

      // Draw other players
      Object.values(state.otherPlayers).forEach((other: any) => {
        // Interpolate or just draw at current pos
        other.x += other.vx; // simple prediction
        other.y += other.vy;
        other.vy += 0.4; // simple gravity
        // Clamp to floor for prediction (crude)
        const topTy = Math.floor(other.y / TILE_SIZE);
        const botTy = Math.floor((other.y + player.height) / TILE_SIZE);
        const tx = Math.floor((other.x + player.width/2) / TILE_SIZE);
        if (world[tx] && world[tx][botTy] && world[tx][botTy] !== BlockType.Air) {
           other.vy = 0;
           other.y = botTy * TILE_SIZE - player.height - 0.01;
        }

        drawPlayer(other.x, other.y, other.vx, other.facingRight, 'blue', other.id.substring(0, 4), other.tool, other.isMining);
      });

      // Random tick near player for farming
      if (state.socket && Math.random() < 0.2) {
         const cx = Math.floor(player.x / TILE_SIZE);
         const cy = Math.floor(player.y / TILE_SIZE);
         const rx = cx + Math.floor((Math.random() - 0.5) * 40);
         const ry = cy + Math.floor((Math.random() - 0.5) * 40);
         if (world[rx] && world[rx][ry]) {
            const b = world[rx][ry];
            if (b === BlockType.Leaves && Math.random() < 0.05) {
               state.socket.emit('spawn_item', { type: BlockType.Apple, x: rx * TILE_SIZE, y: ry * TILE_SIZE });
            } else if (b === BlockType.CarrotCrop1) {
               state.socket.emit('block_update', { tx: rx, ty: ry, blockType: BlockType.CarrotCrop2 });
               world[rx][ry] = BlockType.CarrotCrop2;
            } else if (b === BlockType.CarrotCrop2) {
               state.socket.emit('block_update', { tx: rx, ty: ry, blockType: BlockType.CarrotCrop3 });
               world[rx][ry] = BlockType.CarrotCrop3;
            }
         }
      }

      // Draw items
      Object.values(state.items).forEach((item: any) => {
         // simple prediction
         item.x += item.vx || 0;
         item.y += item.vy || 0;
         item.vy = (item.vy || 0) + 0.4;
         const tx = Math.floor((item.x + 8) / TILE_SIZE);
         const ty = Math.floor((item.y + 16) / TILE_SIZE);
         if (world[tx] && world[tx][ty] && world[tx][ty] !== BlockType.Air) {
            item.vy = 0;
            item.vx = 0;
            item.y = ty * TILE_SIZE - 16;
         }

         ctx.save();
         ctx.translate(item.x + 8, item.y + 8);
         ctx.rotate(timestamp * 0.002);
         ctx.fillStyle = BlockColors[item.type as BlockType] || '#FFF';
         if (item.type === BlockType.CarrotSeed) ctx.fillRect(-2, -2, 4, 4);
         else if (item.type === BlockType.Apple) {
             ctx.beginPath();
             ctx.arc(0, 0, 6, 0, Math.PI*2);
             ctx.fill();
         } else ctx.fillRect(-6, -6, 12, 12);
         ctx.restore();

         // Check collection distance
         const dist = Math.hypot(item.x + 8 - (player.x + player.width / 2), item.y + 8 - (player.y + player.height / 2));
         if (dist < 32 && state.socket) {
            state.socket.emit('collect_item', item.id);
            delete state.items[item.id]; // optimistic
         }
      });

      // Draw mobs
      Object.values(state.mobs).forEach((mob: any) => {
         // Smoothly interpolate towards server authoritative position
         if (mob.targetX !== undefined) {
            mob.x += (mob.targetX - mob.x) * 0.3;
            mob.y += (mob.targetY - mob.y) * 0.3;
         }

         if (mob.type === 'zombie') {
            ctx.fillStyle = '#2E7D32'; // dark green body
            ctx.fillRect(mob.x, mob.y - 12, 24, 36);
            ctx.fillStyle = '#388E3C'; // head
            ctx.fillRect(mob.x - 2, mob.y - 24, 28, 12);
            // eyes
            ctx.fillStyle = '#000';
            const eyeOffset = mob.facingRight ? 16 : 4;
            ctx.fillRect(mob.x - 2 + eyeOffset, mob.y - 20, 4, 4);
            ctx.fillRect(mob.x - 2 + eyeOffset + 6, mob.y - 20, 4, 4);
            // arms
            ctx.fillStyle = '#1B5E20';
            ctx.fillRect(mob.facingRight ? mob.x + 12 : mob.x - 4, mob.y - 8, 16, 6);
         } else {
            // Slime
            ctx.fillStyle = '#4CAF50';
            // pulse based on time
            const pulse = Math.sin(timestamp * 0.01) * 2;
            ctx.fillRect(mob.x, mob.y - pulse, 24, 24 + pulse);
            
            // Eyes
            ctx.fillStyle = '#000';
            const eyeOffset = mob.facingRight ? 12 : 4;
            ctx.fillRect(mob.x + eyeOffset, mob.y + 6 - pulse, 4, 4);
            ctx.fillRect(mob.x + eyeOffset + 6, mob.y + 6 - pulse, 4, 4);
         }
      });

      // Draw local player
      drawPlayer(player.x, player.y, player.vx, player.facingRight, 'orange', 'You', selectedBlock, state.miningProgress > 0);

      // Draw block highlight outline
      if (inBounds && dist <= MAX_REACH) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(targetTx * TILE_SIZE, targetTy * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // Draw mining progress
        if (state.miningProgress > 0 && state.miningTarget && state.miningTarget.x === targetTx && state.miningTarget.y === targetTy) {
           const currentBlock = world[targetTx][targetTy];
           const hardness = BlockHardness[currentBlock] || 1;
           const timeRequired = hardness * 300;
           const progressRatio = Math.min(1, state.miningProgress / timeRequired);
           
           ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
           ctx.fillRect(targetTx * TILE_SIZE, targetTy * TILE_SIZE + TILE_SIZE - 4, TILE_SIZE, 4);
           ctx.fillStyle = '#4CAF50';
           ctx.fillRect(targetTx * TILE_SIZE, targetTy * TILE_SIZE + TILE_SIZE - 4, TILE_SIZE * progressRatio, 4);
        }
      } else if (inBounds) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(targetTx * TILE_SIZE, targetTy * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }

      // Draw Damage Texts
      for (let i = state.damageTexts.length - 1; i >= 0; i--) {
        const dtTxt = state.damageTexts[i];
        dtTxt.life++;
        dtTxt.y -= 0.5; // float upwards
        
        const alpha = 1 - (dtTxt.life / dtTxt.maxLife);
        ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`-${dtTxt.damage}`, dtTxt.x + 12, dtTxt.y);
        
        if (dtTxt.life >= dtTxt.maxLife) {
          state.damageTexts.splice(i, 1);
        }
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dimensions, selectedBlock]);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-crosshair overflow-hidden">
      <canvas 
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block"
      />
    </div>
  );
}
