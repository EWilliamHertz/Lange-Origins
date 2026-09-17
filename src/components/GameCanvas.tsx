import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { BlockType, BlockColors, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, BlockHardness, SolidBlocks } from '../lib/constants';
const ATTACK_RANGE = 64;
import { World } from '../lib/world';
import { PlayerState, updatePhysics } from '../lib/physics';
import { computeLighting, LightMap } from '../lib/lighting';
import { Sounds } from '../lib/audio';
import { Crosshair } from 'lucide-react';

interface GameProps {
  nickname: string;
  characterSkin?: string;
  helmet?: number | null;
  chestplate?: number | null;
  selectedBlock: BlockType | null;
  roomId: string;
  userId?: string;
  email?: string;
  profileId?: string;
  isInventoryOpen: boolean;
  onHealthChange: (health: number) => void;
  onArmorDamage?: () => void;
  sendChatMsg?: {text: string, timestamp: number} | null;
  onToolDurabilityLoss?: () => void;
  onChatMessage?: (msg: {sender: string, text: string}) => void;
  onBlockMined?: (blockType: BlockType) => void;
  onBlockPlaced?: (blockType: BlockType) => void;
  onInteract?: (blockType: BlockType, tx: number, ty: number) => void;
  onPlayerInteract?: (playerId: string, playerName: string) => void;
  onTradeRequest?: (senderId: string, senderName: string) => void;
  onTradeStarted?: (trade: any) => void;
  onTradeUpdated?: (trade: any) => void;
  onTradeCompleted?: (result: any) => void;
  onTradeCancelled?: (reason: string) => void;
  onPartyInvite?: (senderId: string, senderName: string) => void;
  onFriendRequest?: (senderId: string, senderName: string) => void;

  onDuelRequest?: (senderId: string, senderName: string) => void;
  onDuelStarted?: (opponentId: string, opponentName: string) => void;
  onChestData?: (tx: number, ty: number, inventory: any[]) => void;
  onChestUpdated?: (tx: number, ty: number, inventory: any[]) => void;
  onMobKilled?: (type: string) => void;
  onGiveSp?: (amount: number) => void;
  onGiveXp?: (amount: number) => void;
  onGiveLevel?: (amount: number) => void;
  currentParty?: any;
  onFireWeapon?: (weaponType: number) => void;
  currentAmmoCount?: number;
  skills?: { strength: number, dexterity: number, intelligence: number };
  mana?: number;
  onManaChange?: (mana: number) => void;
  duelingOpponents?: string[];
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

export default function Game({ nickname, characterSkin, helmet, chestplate, selectedBlock, roomId, userId, email, profileId, isInventoryOpen, onHealthChange, onArmorDamage, sendChatMsg, onChatMessage, onBlockMined, onBlockPlaced, onInteract, onPlayerInteract, onDepthChange, onTradeRequest, onTradeStarted, onTradeUpdated, onTradeCompleted, onTradeCancelled, onPartyInvite, onFriendRequest, onDuelRequest, onDuelStarted, onChestData, onChestUpdated, currentParty, socketRef, onFireWeapon, currentAmmoCount, duelingOpponents, skills, mana, onManaChange, onToolDurabilityLoss, onMobKilled, onGiveSp, onGiveXp, onGiveLevel }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  interface DamageText {
    id: string;
    x: number;
    y: number;
    damage?: number;
    text?: string;
    life: number;
    maxLife: number;
    color?: string;
    size?: number;
    vx?: number;
    vy?: number;
    isCrit?: boolean;
    scale?: number;
  }

  interface AttackEffect {
    id: string;
    x: number;
    y: number;
    angle: number;
    life: number;
    maxLife: number;
    type: 'slash' | 'punch' | 'magic';
    facingRight: boolean;
  }

  // Ref for mutable game state to avoid re-renders
  const gameState = useRef<{
    world: World;
    player: PlayerState;
    otherPlayers: Record<string, {x: number, y: number, vx: number, vy: number, facingRight: boolean}>;
    socket: Socket | null;
    myId: string | null;
    keys: Record<string, boolean>;
    grapplePoint: { x: number, y: number } | null;
    grappleTimer: number;
    mouseX: number;
    mouseY: number;
    cameraX: number;
    cameraY: number;
    mouseDown: boolean;
    lastTime: number;
    interactionCooldown: number;
    shakeTimer: number;
    
    timeOfDay: number;
    clouds: {x: number, y: number, speed: number, size: number}[];

    particles: Particle[];
    projectiles: Record<string, any>;
    miningProgress: number;
    miningTarget: { x: number, y: number } | null;
    lightMap: LightMap | null;
    lastLightTime: number;
    lastFootstepTime?: number;
    mobs: Record<string, any>;
    items: Record<string, any>;
    damageTexts: DamageText[];
    attackEffects: AttackEffect[];
    explored: boolean[][];
    showMap: boolean;
    
    // MMO Combat State
    targetId: string | null;
    targetType: 'mob' | 'player' | null;
    autoAttacking: boolean;
    autoAttackTimer: number;
    globalCooldown: number;
    abilityCooldowns: Record<string, number>;
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
      health: 20,
      maxHealth: 20,
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
      shakeTimer: 0,
    
    timeOfDay: 0.35, // Start in the morning
    clouds: Array(20).fill(0).map(() => ({
       x: Math.random() * 2000,
       y: 50 + Math.random() * 200,
       speed: 0.2 + Math.random() * 0.4,
       size: 40 + Math.random() * 60
    })),

    particles: [],
      projectiles: {},
    miningProgress: 0,
    miningTarget: null,
    lightMap: null,
    lastLightTime: 0,
    mobs: {},
    items: {},
    damageTexts: [],
    attackEffects: [],
    explored: [],
    showMap: false,
    
    targetId: null,
    targetType: null,
    autoAttacking: false,
    autoAttackTimer: 0,
    globalCooldown: 0,
    abilityCooldowns: {},
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
      socket.emit('join_room', { roomId, nickname: propsRef.current.nickname, uid: propsRef.current.userId, email: propsRef.current.email, profileId: propsRef.current.profileId });
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
           socket.emit('player_update', { name: propsRef.current.nickname, skin: propsRef.current.characterSkin, helmet: propsRef.current.helmet, chest: propsRef.current.chestplate,
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
      if (propsRef.current.onChatMessage) {
        propsRef.current.onChatMessage({ sender: 'System', text: `${player.name || 'A player'} joined the game.` });
      }
    });

    socket.on('player_left', (id: string) => {
      const p = gameState.current.otherPlayers[id];
      if (p && propsRef.current.onChatMessage) {
        propsRef.current.onChatMessage({ sender: 'System', text: `${p.name || 'A player'} left the game.` });
      }
      delete gameState.current.otherPlayers[id];
    });

    socket.on('player_moved', (player: any) => {
      if (gameState.current.otherPlayers[player.id]) {
        gameState.current.otherPlayers[player.id] = player;
      } else {
        gameState.current.otherPlayers[player.id] = player;
      }
    });

    

    socket.on('duel_request', (data: { senderId: string, senderName: string }) => {
      if (propsRef.current.onDuelRequest) propsRef.current.onDuelRequest(data.senderId, data.senderName);
    });
    socket.on('duel_started', (data: { opponentId: string, opponentName: string }) => {
      if (propsRef.current.onDuelStarted) propsRef.current.onDuelStarted(data.opponentId, data.opponentName);
    });
    socket.on('chest_data', (data: {tx: number, ty: number, inventory: any[]}) => {
      if (propsRef.current.onChestData) propsRef.current.onChestData(data.tx, data.ty, data.inventory);
    });
    socket.on('chest_updated', (data: {tx: number, ty: number, inventory: any[]}) => {
      if (propsRef.current.onChestUpdated) propsRef.current.onChestUpdated(data.tx, data.ty, data.inventory);
    });

    socket.on('trade_request', (data: { senderId: string, senderName: string }) => {
      if (propsRef.current.onTradeRequest) {
        propsRef.current.onTradeRequest(data.senderId, data.senderName);
      }
    });

    socket.on('trade_started', (data: any) => {
      if (propsRef.current.onTradeStarted) propsRef.current.onTradeStarted(data);
    });

    socket.on('trade_updated', (data: any) => {
      if (propsRef.current.onTradeUpdated) propsRef.current.onTradeUpdated(data);
    });

    socket.on('trade_completed', (data: any) => {
      if (propsRef.current.onTradeCompleted) propsRef.current.onTradeCompleted(data);
    });

    socket.on('trade_cancelled', (data: any) => {
      if (propsRef.current.onTradeCancelled) propsRef.current.onTradeCancelled(data.reason);
    });
    
    socket.on('party_invite', (data: { senderId: string, senderName: string }) => {
      if (propsRef.current.onPartyInvite) {
        propsRef.current.onPartyInvite(data.senderId, data.senderName);
      }
    });

socket.on('chat_message', (msg: {id: string, name?: string, message: string}) => {
      if (onChatMessage) {
        onChatMessage({ sender: msg.name || msg.id, text: msg.message });
      }
    });

    socket.on('teleport', (data: {x: number, y: number}) => {
       gameState.current.player.x = data.x;
       gameState.current.player.y = data.y;
       gameState.current.player.vy = 0;
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

    
    socket.on('projectiles_update', (projs: Record<string, any>) => {
       if (gameState.current) gameState.current.projectiles = projs;
    });

    socket.on('items_update', (items: Record<string, any>) => {
      const current = gameState.current.items;
      // Add new items from server; remove items no longer on server
      const serverIds = new Set(Object.keys(items));
      // Remove items deleted server-side
      for (const id in current) {
        if (!serverIds.has(id)) delete current[id];
      }
      // Add new items, but preserve client-side position/velocity for existing ones
      for (const id in items) {
        if (!current[id]) {
          // Brand new item — add it with a local spawnTime so pickup delay works
          current[id] = { ...items[id], spawnTime: Date.now() };
        }
        // existing items: keep client physics, just update type/count from server
      }
    });

    socket.on('item_collected', (data: { id: string, type: number, playerId: string }) => {
      if (gameState.current.items[data.id]) {
        delete gameState.current.items[data.id];
      }
      if (data.playerId === socket.id && propsRef.current.onBlockMined) {
        propsRef.current.onBlockMined(data.type);
      }
    });

    
    socket.on('grappled', (data: { hx: number, hy: number }) => {
      gameState.current.grapplePoint = { x: data.hx, y: data.hy };
      gameState.current.grappleTimer = 30;
      gameState.current.player.grounded = false;
    });

    socket.on('take_damage', (data: { damage: number, vx: number, vy: number }) => {
      const p = gameState.current.player;
      if (p.invulnerableTimer <= 0) {
          const hTier = propsRef.current.helmet;
          const cTier = propsRef.current.chestplate;
          const hMitig = hTier === 409 ? 0.35 : (hTier === 407 ? 0.2 : (hTier === 400 ? 0.3 : 0));
          const cMitig = cTier === 410 ? 0.45 : (cTier === 408 ? 0.25 : (cTier === 401 ? 0.35 : 0));
          const mitigation = hMitig + cMitig;
          const finalDamage = Math.max(1, Math.floor(data.damage * (1 - mitigation)));
          p.health = Math.max(0, p.health - finalDamage);
          if (mitigation > 0 && propsRef.current.onArmorDamage) {
             propsRef.current.onArmorDamage();
          }
          p.invulnerableTimer = 60;
          p.vx = data.vx;
          p.vy = data.vy;
      }
    });

    socket.on('mob_killed', (data: { mobId: string, type: string, killerId: string }) => {
      if (data.killerId === socket.id && propsRef.current.onMobKilled) {
        propsRef.current.onMobKilled(data.type);
      }
    });

    socket.on('give_sp', (amount: number) => {
      if (propsRef.current.onGiveSp) propsRef.current.onGiveSp(amount);
    });

    socket.on('give_xp', (amount: number) => {
      if (propsRef.current.onGiveXp) propsRef.current.onGiveXp(amount);
    });

    socket.on('give_level', (amount: number) => {
      if (propsRef.current.onGiveLevel) propsRef.current.onGiveLevel(amount);
    });

    socket.on('damage_indicator', (data: { id: string, x: number, y: number, damage: number }) => {
      const isHeal = data.damage < 0;
      const amount = Math.abs(data.damage);
      const isCrit = amount > 9 && !isHeal;
      
      gameState.current.damageTexts.push({
        id: data.id,
        x: data.x + (Math.random() - 0.5) * 16,
        y: data.y - 20,
        damage: amount,
        text: isHeal ? `+${amount}` : undefined,
        life: 0,
        maxLife: isCrit ? 60 : 45,
        color: isHeal ? '#2ECC40' : (isCrit ? '#FFD700' : '#FF4444'),
        size: isCrit ? 22 : (isHeal ? 16 : 14),
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1.5,
        isCrit: isCrit,
        scale: isCrit ? 1.4 : 1,
      });
      
      // Spawn hit particles for everyone when someone takes damage
      if (!isHeal) {
        for (let p = 0; p < (isCrit ? 6 : 3); p++) {
           gameState.current.particles.push({
             x: data.x + 12, y: data.y,
             vx: (Math.random() - 0.5) * 6,
             vy: -Math.random() * 4 - 1,
             life: 0, maxLife: 20,
             color: isCrit ? '#FFD700' : '#FF4444',
             size: isCrit ? 4 : 2,
           });
        }
      }
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
const propsRef = useRef({ nickname, currentAmmoCount, selectedBlock, roomId, userId, email, profileId, isInventoryOpen, onHealthChange, onArmorDamage, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onTradeStarted, onTradeUpdated, onTradeCompleted, onTradeCancelled, onPartyInvite, onDepthChange, onBlockPlaced, currentParty, onFireWeapon, characterSkin, duelingOpponents, onDuelRequest, onDuelStarted, onChestData, onChestUpdated, helmet, chestplate, skills, mana, onManaChange, onToolDurabilityLoss, onMobKilled, onGiveSp, onGiveXp, onGiveLevel });
  useEffect(() => {
    propsRef.current = { nickname, currentAmmoCount, selectedBlock, roomId, userId, email, profileId, isInventoryOpen, onHealthChange, onArmorDamage, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onTradeStarted, onTradeUpdated, onTradeCompleted, onTradeCancelled, onPartyInvite, onDepthChange, onBlockPlaced, currentParty, onFireWeapon, characterSkin, duelingOpponents, onDuelRequest, onDuelStarted, onChestData, onChestUpdated, helmet, chestplate, skills, mana, onManaChange, onToolDurabilityLoss, onMobKilled, onGiveSp, onGiveXp, onGiveLevel };
  }, [nickname, currentAmmoCount, selectedBlock, roomId, userId, email, profileId, isInventoryOpen, onHealthChange, onArmorDamage, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onTradeStarted, onTradeUpdated, onTradeCompleted, onTradeCancelled, onPartyInvite, onDepthChange, onBlockPlaced, currentParty, onFireWeapon, characterSkin, duelingOpponents, onDuelRequest, onDuelStarted, onChestData, onChestUpdated, helmet, chestplate, skills, mana, onManaChange, onToolDurabilityLoss, onMobKilled, onGiveSp, onGiveXp, onGiveLevel]);

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
      const key = e.key.toLowerCase();
      gameState.current.keys[key] = true;
      
      // MMO Abilities
      if ((key === 'z' || key === 'x' || key === 'c') && gameState.current.globalCooldown <= 0 && gameState.current.targetId && gameState.current.socket) {
          const state = gameState.current;
          let cost = 0;
          let cd = 0;
          let abilityName = '';
          if (key === 'z' && (state.abilityCooldowns['slash'] || 0) <= 0) { cost = 0; cd = 3000; abilityName = 'slash'; }
          else if (key === 'x' && (state.abilityCooldowns['fireball'] || 0) <= 0) { cost = 10; cd = 5000; abilityName = 'fireball'; }
          else if (key === 'c' && (state.abilityCooldowns['heal'] || 0) <= 0) { cost = 20; cd = 10000; abilityName = 'heal'; }
          
          if (abilityName !== '') {
              // Note: actual cost logic would hook into props, but for now just send event
              state.socket.emit('use_ability', { ability: abilityName, targetId: state.targetId, targetType: state.targetType });
              state.globalCooldown = 1500;
              state.abilityCooldowns[abilityName] = cd;
          }
      }
      
      if (key === 'e') {
        const hoveredPlayer = checkPlayerHover(gameState.current.mouseX, gameState.current.mouseY);
        if (hoveredPlayer && propsRef.current.onPlayerInteract) {
           propsRef.current.onPlayerInteract(hoveredPlayer.id, hoveredPlayer.name);
        }
      }
      if (key === 'm') {
        gameState.current.showMap = !gameState.current.showMap;
      }
      if (['w','a','s','d',' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.current.keys[e.key.toLowerCase()] = false;
    };
    
    
    const checkPlayerHover = (x: number, y: number) => {
      const mx = x + gameState.current.cameraX;
      const my = y + gameState.current.cameraY;
      for (const [id, other] of Object.entries(gameState.current.otherPlayers)) {
        const px = (other as any).x - (TILE_SIZE * 0.8) / 2;
        const py = (other as any).y - (TILE_SIZE * 1.8) / 2;
        if (mx >= px && mx <= px + TILE_SIZE * 0.8 && my >= py && my <= py + TILE_SIZE * 1.8) {
          return { id, name: (other as any).name || id.substring(0, 4) };
        }
      }
      return null;
    };
    
    const checkMobHover = (x: number, y: number) => {
      const mx = x + gameState.current.cameraX;
      const my = y + gameState.current.cameraY;
      for (const [id, mob] of Object.entries(gameState.current.mobs)) {
        const px = (mob as any).x - TILE_SIZE / 2;
        const py = (mob as any).y - TILE_SIZE;
        if (mx >= px && mx <= px + TILE_SIZE && my >= py && my <= py + TILE_SIZE) {
          return id;
        }
      }
      return null;
    };

    const updateMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Calculate mouse position relative to the canvas internal resolution
      gameState.current.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      gameState.current.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    };

    const handleMouseDown = (e: MouseEvent) => {
      updateMousePos(e);
      if (e.button === 0) {
          gameState.current.mouseDown = true;
          
          // MMO Targeting
          const mx = gameState.current.mouseX;
          const my = gameState.current.mouseY;
          const mobId = checkMobHover(mx, my);
          const playerId = checkPlayerHover(mx, my);
          if (mobId) {
              gameState.current.targetId = mobId;
              gameState.current.targetType = 'mob';
              gameState.current.autoAttacking = true;
              gameState.current.autoAttackTimer = 0; // instantly attack on click
          } else if (playerId) {
              gameState.current.targetId = playerId.id;
              gameState.current.targetType = 'player';
              gameState.current.autoAttacking = true;
              gameState.current.autoAttackTimer = 0; // instantly attack on click
          }
      }
      if (e.button === 2) gameState.current.rightMouseDown = true;
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) gameState.current.mouseDown = false;
      if (e.button === 2) gameState.current.rightMouseDown = false;
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      const hoveredPlayer = checkPlayerHover(mx, my);
      if (hoveredPlayer && propsRef.current.onPlayerInteract) {
         propsRef.current.onPlayerInteract(hoveredPlayer.id, hoveredPlayer.name);
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if ((e.buttons & 1) === 0) {
        gameState.current.mouseDown = false;
      }
      updateMousePos(e);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    
    const handleToss = (e: Event) => {
       const detail = (e as CustomEvent).detail;
       if (gameState.current.socket) {
          gameState.current.socket.emit('drop_item', { type: detail.type, count: detail.count, facingRight: gameState.current.player.facingRight });
       }
    };

    window.addEventListener('toss_item', handleToss);

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
      player.maxHealth = 20 + (propsRef.current.skills?.strength || 0) * 10;
      
      // Update Physics
      if (world.length > 0 && !propsRef.current.isInventoryOpen) {
        const oldX = player.x;
        const oldY = player.y;
        updatePhysics(player, world, keysToUse, propsRef.current.skills?.dexterity || 0);

        // Update explored area
        if (state.explored.length !== world.length || (world.length > 0 && state.explored[0].length !== world[0].length)) {
           state.explored = Array.from({ length: world.length }, () => Array(world[0].length).fill(false));
        }
        if (world.length > 0) {
          const viewRadiusX = Math.ceil(dimensions.width / TILE_SIZE / 2) + 2;
          const viewRadiusY = Math.ceil(dimensions.height / TILE_SIZE / 2) + 2;
          
          const revealArea = (x: number, y: number) => {
            const px = Math.floor(x / TILE_SIZE);
            const py = Math.floor(y / TILE_SIZE);
            for (let ix = -viewRadiusX; ix <= viewRadiusX; ix++) {
              for (let iy = -viewRadiusY; iy <= viewRadiusY; iy++) {
                const tx = px + ix;
                const ty = py + iy;
                if (tx >= 0 && tx < world.length && ty >= 0 && ty < world[0].length) {
                  state.explored[tx][ty] = true;
                }
              }
            }
          };
          
          revealArea(player.x, player.y);
          for (const opId in state.otherPlayers) {
            revealArea(state.otherPlayers[opId].x, state.otherPlayers[opId].y);
          }
        }

        // Mob Touch Damage
        if (player.invulnerableTimer <= 0) {
           for (const mobId in state.mobs) {
              const mob = state.mobs[mobId];
              const pLeft = player.x; const pRight = player.x + player.width;
              const pTop = player.y; const pBottom = player.y + player.height;
              
              const mLeft = mob.x; const mRight = mob.x + 24;
              const mTop = mob.y - 24;
              const mBottom = mob.y + 24;
              
              const intersectX = pLeft < mRight && pRight > mLeft;
              const intersectY = pTop < mBottom && pBottom > mTop;
              
              
                            if (intersectX && intersectY && ((mob.type === 'wolf' && !mob.ownerId) || mob.type === 'rival_thug' || mob.type === 'slime' || mob.type === 'skeleton' || mob.type === 'creeper')) {
                               const baseDmg = (mob.type === 'golem_boss') ? 20 : (mob.type === 'creeper') ? 14 : (mob.type === 'skeleton' ? 5 : (mob.type === 'wolf' ? 4 : 3));
                               const hTier = propsRef.current.helmet;
                               const cTier = propsRef.current.chestplate;
                               const hMitig = hTier === 409 ? 0.35 : (hTier === 407 ? 0.2 : (hTier === 400 ? 0.3 : 0));
                               const cMitig = cTier === 410 ? 0.45 : (cTier === 408 ? 0.25 : (cTier === 401 ? 0.35 : 0));
                               const mitigation = hMitig + cMitig;
                               const finalDamage = Math.max(1, Math.floor(baseDmg * (1 - mitigation)));
                               
                               player.health = Math.max(0, player.health - finalDamage);
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
           state.socket.emit('player_update', { name: propsRef.current.nickname, skin: propsRef.current.characterSkin, helmet: propsRef.current.helmet, chest: propsRef.current.chestplate,
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
           state.socket.emit('player_update', { name: propsRef.current.nickname, skin: propsRef.current.characterSkin, helmet: propsRef.current.helmet, chest: propsRef.current.chestplate,
             x: player.x, y: player.y, vx: 0, vy: 0, facingRight: player.facingRight,
             tool: propsRef.current.selectedBlock, isMining: false
           });
         }
      }

      if (player.health !== prevHealth) {
         if (player.health < prevHealth) {
           Sounds.hurt();
           state.shakeTimer = 20;
         }
         propsRef.current.onHealthChange(player.health);
      }
      
      // Camera follow
      // Center the player on screen
      const targetCameraX = player.x + player.width / 2 - dimensions.width / 2;
      const targetCameraY = player.y + player.height / 2 - dimensions.height / 2;
      
      // Smooth camera interpolation
      state.cameraX += (targetCameraX - state.cameraX) * 0.1;
      gameState.current.cameraX = state.cameraX;
      state.cameraY += (targetCameraY - state.cameraY) * 0.1;
      gameState.current.cameraY = state.cameraY;

      // Clamp camera to world bounds (optional, but good)
      state.cameraX = Math.max(0, Math.min(state.cameraX, WORLD_WIDTH * TILE_SIZE - dimensions.width));
      state.cameraY = Math.max(0, Math.min(state.cameraY, WORLD_HEIGHT * TILE_SIZE - dimensions.height));

      // Handle MMO Cooldowns
      if (state.globalCooldown > 0) state.globalCooldown -= dt;
      if (state.autoAttackTimer > 0) state.autoAttackTimer -= dt;
      for (const key in state.abilityCooldowns) {
          if (state.abilityCooldowns[key] > 0) {
              state.abilityCooldowns[key] -= dt;
          }
      }

      // Handle MMO Auto-Attack
      if (state.autoAttacking && state.targetId && state.autoAttackTimer <= 0 && state.socket) {
          let targetObj = null;
          if (state.targetType === 'mob' && state.mobs[state.targetId]) targetObj = state.mobs[state.targetId];
          if (state.targetType === 'player' && state.otherPlayers[state.targetId]) targetObj = state.otherPlayers[state.targetId];
          
          if (targetObj) {
              const dx = targetObj.x - player.x;
              const dy = targetObj.y - player.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist <= ATTACK_RANGE) {
                  const sel = propsRef.current.selectedBlock;
                  const isFist = sel === BlockType.Fists; // Strictly require Fists
                  const isSword = sel === BlockType.WoodSword || sel === BlockType.StoneSword || sel === BlockType.IronSword || sel === 402 || sel === 403; // Gold/Diamond sword
                  const isPickaxe = sel === BlockType.WoodPickaxe || sel === BlockType.StonePickaxe || sel === BlockType.IronPickaxe;
                  const isAxe = sel === BlockType.WoodAxe || sel === BlockType.StoneAxe || sel === BlockType.IronAxe;
                  
                  if (isFist || isSword || isPickaxe || isAxe) {
                      const baseDmg = isSword ? (sel === BlockType.IronSword ? 8 : 5)
                               : isAxe ? (sel === BlockType.IronAxe ? 6 : 4)
                               : isPickaxe ? (sel === BlockType.IronPickaxe ? 5 : 3)
                               : 1;
                      const dmg = baseDmg + (propsRef.current.skills?.strength || 0) * 2;
                      
                      if (state.targetType === 'mob') {
                          state.socket.emit('hit_mob', { mobId: state.targetId, damage: dmg, facingRight: player.x < targetObj.x, playerId: state.socket.id });
                      } else {
                          state.socket.emit('hit_player', { targetId: state.targetId, damage: dmg, facingRight: player.x < targetObj.x });
                      }
                      
                      state.autoAttackTimer = 1500; // 1.5s attack speed
                  }
              }
          } else {
              // Target lost
              state.targetId = null;
              state.targetType = null;
              state.autoAttacking = false;
          }
      }
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
          } else if (selected === BlockType.TreeSeed && (currentBlock === BlockType.Grass || currentBlock === BlockType.Dirt) && world[targetTx][targetTy - 1] === BlockType.Air) {
             world[targetTx][targetTy - 1] = BlockType.Wood;
             world[targetTx][targetTy - 2] = BlockType.Wood;
             world[targetTx][targetTy - 3] = BlockType.Wood;
             world[targetTx - 1][targetTy - 4] = BlockType.Leaves;
             world[targetTx][targetTy - 4] = BlockType.Leaves;
             world[targetTx + 1][targetTy - 4] = BlockType.Leaves;
             world[targetTx][targetTy - 5] = BlockType.Leaves;
             if (state.socket) {
                 state.socket.emit('block_update', { tx: targetTx, ty: targetTy - 1, blockType: BlockType.Wood });
                 state.socket.emit('block_update', { tx: targetTx, ty: targetTy - 2, blockType: BlockType.Wood });
                 state.socket.emit('block_update', { tx: targetTx, ty: targetTy - 3, blockType: BlockType.Wood });
                 state.socket.emit('block_update', { tx: targetTx - 1, ty: targetTy - 4, blockType: BlockType.Leaves });
                 state.socket.emit('block_update', { tx: targetTx, ty: targetTy - 4, blockType: BlockType.Leaves });
                 state.socket.emit('block_update', { tx: targetTx + 1, ty: targetTy - 4, blockType: BlockType.Leaves });
                 state.socket.emit('block_update', { tx: targetTx, ty: targetTy - 5, blockType: BlockType.Leaves });
             }
             if (propsRef.current.onInteract) propsRef.current.onInteract(BlockType.TreeSeed, targetTx, targetTy);
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
        
        const characterSkin = propsRef.current.characterSkin || 'orange';
        const isGun = propsRef.current.selectedBlock === BlockType.Gun; // Gun
        const isBow = propsRef.current.selectedBlock === BlockType.Bow; // Bow
        const isGrenade = propsRef.current.selectedBlock === BlockType.Grenade; // Grenade
        const isStaff = propsRef.current.selectedBlock === BlockType.WizardStaff; // Staff
        const isGrapple = propsRef.current.selectedBlock === BlockType.GrapplingHook; // Grapple

        if (isGrapple && state.interactionCooldown <= 0) {
            if (propsRef.current.onToolDurabilityLoss) propsRef.current.onToolDurabilityLoss();
            
            const dx = (targetTx * 32 + 16) - player.x;
            const dy = (targetTy * 32 + 16) - player.y;
            const mDist = Math.sqrt(dx*dx + dy*dy) || 1;
            const maxRange = 1500; // max grapple distance
            if (mDist < maxRange) {
               // Raycast
               let steps = Math.floor(mDist);
               let hit = false;
               let hx = 0; let hy = 0;
               let hitPlayerId = null;
               for (let i = 0; i < steps; i+=4) {
                   const cx = player.x + (dx/mDist) * i;
                   const cy = player.y + (dy/mDist) * i;
                   
                   for (const pId in state.otherPlayers) {
                       if (pId === state.socket?.id) continue;
                       const p = state.otherPlayers[pId];
                       if (cx >= p.x && cx <= p.x + 24 && cy >= p.y && cy <= p.y + 36) {
                           hit = true;
                           hitPlayerId = pId;
                           hx = p.x;
                           hy = p.y;
                           break;
                       }
                   }
                   if (hit) break;
                   
                   const gTx = Math.floor(cx / 32);
                   const gTy = Math.floor(cy / 32);
                   if (gTx >= 0 && gTx < world.length && gTy >= 0 && gTy < world[0].length) {
                       const bType = world[gTx][gTy];
                       if (SolidBlocks.has(bType)) {
                           hit = true;
                           hx = cx;
                           hy = cy;
                           break;
                       }
                   }
               }
               if (hit) {
                   if (hitPlayerId && state.socket) {
                       state.socket.emit('grapple_pull', { targetId: hitPlayerId, hx: player.x, hy: player.y });
                   }
                   player.grounded = false;
                   state.grapplePoint = { x: hx, y: hy };
                   state.grappleTimer = 30;
                   state.damageTexts.push({ id: Math.random().toString(), text: 'Swoosh!', x: player.x, y: player.y - 15, life: 1, maxLife: 30, color: '#DDDDDD', size: 12 });
                   state.interactionCooldown = 600;
               } else {
                   state.damageTexts.push({ id: Math.random().toString(), text: 'Miss!', x: player.x, y: player.y - 15, life: 1, maxLife: 30, color: '#FF4444', size: 12 });
                   state.interactionCooldown = 200;
               }
            } else {
                state.damageTexts.push({ id: Math.random().toString(), text: 'Aim closer!', x: player.x, y: player.y - 15, life: 1, maxLife: 30, color: '#FF4444', size: 12 });
                state.interactionCooldown = 200;
            }
        }
        
        if ((isGun || isBow || isGrenade || isStaff) && state.interactionCooldown <= 0 && state.socket) {
             if ((propsRef.current.currentAmmoCount || 0) <= 0) {
                 state.interactionCooldown = 500;
                 state.damageTexts.push({ id: Math.random().toString(), text: 'No Ammo!', x: player.x, y: player.y - 15, life: 1, maxLife: 40, color: '#FF3333', size: 14 });
             } else {
                 const dx = (targetTx * 32 + 16) - player.x;
                 const dy = (targetTy * 32 + 16) - player.y;
                 const mDist = Math.sqrt(dx*dx + dy*dy) || 1;
                 const speed = isGun ? 25 : (isBow ? 15 : 10);
                 const vx = (dx / mDist) * speed;
                 const vy = (dy / mDist) * speed;
                 const type = isGun ? 'bullet' : (isBow ? 'arrow' : (isStaff ? 'fireball' : 'grenade'));
                 
                 const baseProjDmg = type === 'bullet' ? 15 : (type === 'arrow' ? 8 : (type === 'fireball' ? 30 : 20));
                 const bonusProjDmg = (isGun || isBow || isGrenade) ? (propsRef.current.skills?.dexterity || 0) * 2 : (propsRef.current.skills?.intelligence || 0) * 3;
                 const projDamage = baseProjDmg + bonusProjDmg;
                 
                 if (isStaff) {
                     // Requires mana check in parent, but we will send mana decrease event
                     if ((propsRef.current.mana || 0) < 10) {
                        state.interactionCooldown = 500;
                        state.damageTexts.push({ id: Math.random().toString(), text: 'No Mana!', x: player.x, y: player.y - 15, life: 1, maxLife: 40, color: '#4444FF', size: 14 });
                     } else {
                         state.socket.emit('fire_projectile', { type, x: player.x, y: player.y - 12, vx, vy, damage: projDamage });
                         state.interactionCooldown = isGun ? 100 : (isBow ? 300 : (isStaff ? 250 : 400));
                         
                         if (propsRef.current.onFireWeapon && propsRef.current.selectedBlock !== null) {
                             propsRef.current.onFireWeapon(propsRef.current.selectedBlock);
                         }
                     }
                 } else {
                     state.socket.emit('fire_projectile', { type, x: player.x, y: player.y - 12, vx, vy, damage: projDamage });
                     state.interactionCooldown = isGun ? 100 : (isBow ? 300 : (isStaff ? 250 : 400));
                     
                     if (propsRef.current.onFireWeapon && propsRef.current.selectedBlock !== null) {
                         propsRef.current.onFireWeapon(propsRef.current.selectedBlock);
                     }
                 }
         }
         }
         else if (state.interactionCooldown <= 0) {
           const mx = state.cameraX + state.mouseX;
           const my = state.cameraY + state.mouseY;
           for (const mobId in state.mobs) {
              const mob = state.mobs[mobId];
              const mLeft = mob.x; const mRight = mob.x + 24;
              const mTop = mob.y - 24;
              const mBottom = mob.y + 24;
              
              if (mx >= mLeft && mx <= mRight && my >= mTop && my <= mBottom) {
                 const sel = propsRef.current.selectedBlock;
                 const isFist = sel === BlockType.Fists || sel === 0;
                 const isSword = sel === BlockType.WoodSword || sel === BlockType.StoneSword || sel === BlockType.IronSword || sel === 402 || sel === 403; // Gold/Diamond sword
                 const isPickaxe = sel === BlockType.WoodPickaxe || sel === BlockType.StonePickaxe || sel === BlockType.IronPickaxe;
                 const isAxe = sel === BlockType.WoodAxe || sel === BlockType.StoneAxe || sel === BlockType.IronAxe;
                 
                 if (!isFist && !isSword && !isPickaxe && !isAxe) continue; // Cannot fight with this item
                 
                 if (state.socket) {
                    const baseDmg = isSword ? (sel === BlockType.IronSword ? 8 : 5)
                             : isAxe ? (sel === BlockType.IronAxe ? 6 : 4)
                             : isPickaxe ? (sel === BlockType.IronPickaxe ? 5 : 3)
                             : 1;
                    const dmg = baseDmg + (propsRef.current.skills?.strength || 0) * 2;
                    const isCrit = Math.random() < 0.15;
                    const finalDmg = isCrit ? dmg * 2 : dmg;
                    state.socket.emit('hit_mob', { mobId, damage: finalDmg, facingRight: player.x < mob.x, playerId: state.socket.id });
                    
                    // Attack swing VFX
                    const effectType = isFist ? 'punch' : isSword ? 'slash' : 'slash';
                    state.attackEffects.push({
                      id: Math.random().toString(),
                      x: mob.x + 12,
                      y: mob.y - 12,
                      angle: player.facingRight ? 0 : Math.PI,
                      life: 0,
                      maxLife: 12,
                      type: effectType,
                      facingRight: player.facingRight,
                    });
                    
                    // Camera shake
                    state.shakeTimer = isCrit ? 12 : 6;
                 }
                 state.interactionCooldown = 300; // Attack cooldown
                 hitMob = true;
                 break;
              }
           }
           
          // 1.5 Check PvP Hit
          if (!hitMob && state.socket && propsRef.current.duelingOpponents && propsRef.current.duelingOpponents.length > 0) {
             for (const otherId in state.otherPlayers) {
                if (propsRef.current.duelingOpponents.includes(otherId)) {
                   const other = state.otherPlayers[otherId];
                   const dx = other.x - player.x;
                   const dy = other.y - player.y;
                   const distToOther = Math.sqrt(dx*dx + dy*dy);
                   const ATTACK_RANGE = 48;
                   if (distToOther <= ATTACK_RANGE) {
                      const sel = propsRef.current.selectedBlock;
                      const isFist = sel === BlockType.Fists || sel === 0;
                      const isSword = sel === BlockType.WoodSword || sel === BlockType.StoneSword || sel === BlockType.IronSword || sel === 402 || sel === 403;
                      const isPickaxe = sel === BlockType.WoodPickaxe || sel === BlockType.StonePickaxe || sel === BlockType.IronPickaxe;
                      const isAxe = sel === BlockType.WoodAxe || sel === BlockType.StoneAxe || sel === BlockType.IronAxe;
                      
                      if (!isFist && !isSword && !isPickaxe && !isAxe) continue;

                      // Hit them!
                      const baseDmg = isSword ? (sel === 403 ? 10 : sel === 402 ? 7 : sel === BlockType.IronSword ? 6 : sel === BlockType.StoneSword ? 5 : 4)
                               : isAxe ? (sel === BlockType.IronAxe ? 6 : sel === BlockType.StoneAxe ? 4 : 3)
                               : isPickaxe ? (sel === BlockType.IronPickaxe ? 5 : sel === BlockType.StonePickaxe ? 4 : 3)
                               : 1;
                      const dmg = baseDmg + (propsRef.current.skills?.strength || 0) * 2;
                      state.socket.emit('hit_player', { targetId: otherId, damage: dmg, facingRight: player.x < other.x });
                      
                      const effectType = isFist ? 'punch' : isSword ? 'slash' : 'slash';
                      state.attackEffects.push({
                        id: Math.random().toString(),
                        x: other.x + 12,
                        y: other.y - 12,
                        angle: player.facingRight ? 0 : Math.PI,
                        life: 0,
                        maxLife: 12,
                        type: effectType,
                        facingRight: player.facingRight,
                      });
                      
                      state.interactionCooldown = 300;
                      hitMob = true; // reusing this to skip block mining
                      break;
                   }
                }
             }
          }
         }

         // 2. Block interaction if no mob hit and in reach
         if (!hitMob && dist <= MAX_REACH) {
           const currentBlock = world[targetTx][targetTy];
          
          // Block Placing (Ensure selectedBlock is not null)
          const sel = propsRef.current.selectedBlock;
          const isPlaceable = sel !== null && sel !== BlockType.Air && sel !== BlockType.Fists && (sel < 100 || (sel >= 414 && sel <= 417));
          if (currentBlock === BlockType.Air && isPlaceable && state.interactionCooldown <= 0) {
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
          
          let canMine = false;
          const isFist = selected === BlockType.Fists;
          const isPickaxe = selected === BlockType.WoodPickaxe || selected === BlockType.StonePickaxe || selected === BlockType.IronPickaxe;
          const isAxe = selected === BlockType.WoodAxe || selected === BlockType.StoneAxe || selected === BlockType.IronAxe;
          const isHoe = selected === BlockType.WoodHoe || selected === BlockType.StoneHoe || selected === BlockType.IronHoe;
          
          const hardness = BlockHardness[currentBlock] || 1;
          const isStoneType = hardness >= 2;
          const isWoodType = currentBlock === BlockType.Wood || currentBlock === BlockType.Leaves || currentBlock === BlockType.Door;
          const isDirtType = currentBlock === BlockType.Dirt || currentBlock === BlockType.Grass || currentBlock === BlockType.Sand;
          
          if (isPickaxe) {
              if (isStoneType || isDirtType) { // pickaxes can mine dirt too
                  canMine = true;
                  toolMultiplier = (selected === BlockType.IronPickaxe) ? 12 : (selected === BlockType.StonePickaxe) ? 6 : 3;
              }
          } else if (isAxe) {
              if (isWoodType || isDirtType) {
                  canMine = true;
                  toolMultiplier = (selected === BlockType.IronAxe) ? 12 : (selected === BlockType.StoneAxe) ? 6 : 3;
              }
          } else if (isHoe && isDirtType) {
              canMine = true;
              toolMultiplier = 6;
          } else if (isFist) {
              if (!isStoneType) { // Fist cannot mine stone/ores
                  canMine = true;
                  toolMultiplier = 1;
              }
          }
          
          if (!canMine) {
              state.miningProgress = 0;
          } else {
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
               // Always spawn the broken block itself!
               let dropType = currentBlock;
               if (currentBlock === BlockType.Grass) dropType = BlockType.Dirt;
               if (currentBlock === BlockType.Stone) dropType = BlockType.Stone;

               // If it's a crop or leaves, handle custom drops instead of the block itself
               if (currentBlock === BlockType.CarrotCrop3) {
                   state.socket.emit('spawn_item', { type: BlockType.Carrot, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
                   if (Math.random() > 0.5) state.socket.emit('spawn_item', { type: BlockType.Carrot, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
               } else if (currentBlock === BlockType.CarrotCrop1 || currentBlock === BlockType.CarrotCrop2) {
                   // No drop
               } else if (currentBlock === BlockType.Leaves) {
                   if (Math.random() < 0.1) state.socket.emit('spawn_item', { type: BlockType.Apple, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
                   if (Math.random() < 0.2) state.socket.emit('spawn_item', { type: BlockType.TreeSeed, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
               } else {
                   // Spawn the block item
                   state.socket.emit('spawn_item', { type: dropType, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
               }

               // Additional bonus drops
               if (currentBlock === BlockType.Grass && Math.random() < 0.2) {
                   state.socket.emit('spawn_item', { type: BlockType.CarrotSeed, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
               }
            }
            // Do NOT call onBlockMined directly here. 
            // It will be called when the player physically collects the spawned item via the 'item_collected' socket event.
          }
        }
        }
        }
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
      
      const depth = player.y / TILE_SIZE;
      const surfaceY = 80;
      const depthFactor = Math.max(0, Math.min(1, (depth - surfaceY) / 30));
      if (depthFactor > 0) {
         const ugGrad = ctx.createLinearGradient(0, 0, 0, dimensions.height);
         ugGrad.addColorStop(0, `rgba(15, 10, 8, ${depthFactor})`);
         ugGrad.addColorStop(1, `rgba(5, 2, 0, ${depthFactor})`);
         ctx.fillStyle = ugGrad;
         ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      }
      
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
      
      
      // Update and draw clouds
      ctx.fillStyle = state.timeOfDay > 0.2 && state.timeOfDay < 0.8 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(200, 200, 220, 0.1)';
      state.clouds.forEach(cloud => {
         cloud.x -= cloud.speed * (dt * 0.06);
         if (cloud.x < -200) {
            cloud.x = dimensions.width + 200;
            cloud.y = 50 + Math.random() * 200;
         }
         // Render fluffy cloud
         ctx.beginPath();
         ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
         ctx.arc(cloud.x + cloud.size * 0.4, cloud.y - cloud.size * 0.2, cloud.size * 0.4, 0, Math.PI * 2);
         ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
         ctx.arc(cloud.x + cloud.size * 0.4, cloud.y + cloud.size * 0.1, cloud.size * 0.5, 0, Math.PI * 2);
         ctx.fill();
      });

      
      // Footsteps
      if (player.grounded && Math.abs(player.vx) > 0.5) {
         if (!state.lastFootstepTime) state.lastFootstepTime = 0;
         if (timestamp - state.lastFootstepTime > 300) {
            // Get block under player
            const px = Math.floor((player.x + player.width / 2) / TILE_SIZE);
            const py = Math.floor((player.y + player.height + 2) / TILE_SIZE);
            if (px >= 0 && px < WORLD_WIDTH && py >= 0 && py < WORLD_HEIGHT) {
               const bUnder = world[px][py];
               if (bUnder !== BlockType.Air) {
                  Sounds.footstep(bUnder);
               }
            }
            state.lastFootstepTime = timestamp;
         }
      }

      
      // Battle Music logic
      let closestMobDist = Infinity;
      Object.values(state.mobs).forEach((mob: any) => {
         if (mob.health && mob.health > 0) {
            const dist = Math.hypot(mob.x - player.x, mob.y - player.y);
            if (dist < closestMobDist) closestMobDist = dist;
         }
      });
      if (closestMobDist < 400) {
         Sounds.startBattleMusic();
      } else {
         Sounds.stopBattleMusic();
      }

      ctx.save();
      // Screen shake
      const shakeAmt = state.shakeTimer > 0 ? (state.shakeTimer / 20) * 6 : 0;
      const shakeX = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;
      const shakeY = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;
      if (state.shakeTimer > 0) state.shakeTimer--;
      ctx.translate(-Math.floor(state.cameraX) + shakeX, -Math.floor(state.cameraY) + shakeY);
      
      const startCol = Math.max(0, Math.floor(state.cameraX / TILE_SIZE));
      const endCol = Math.min(WORLD_WIDTH - 1, Math.floor((state.cameraX + dimensions.width) / TILE_SIZE));
      const startRow = Math.max(0, Math.floor(state.cameraY / TILE_SIZE));
      const endRow = Math.min(WORLD_HEIGHT - 1, Math.floor((state.cameraY + dimensions.height) / TILE_SIZE));

      // Compute light map periodically or if it doesn't exist
      if (world.length > 0 && (!state.lightMap || timestamp - state.lastLightTime > 150)) {
         const extraLights = [];
         if (propsRef.current.selectedBlock === 12) { // 12 is Torch
            extraLights.push({
               x: Math.floor((player.x + player.width / 2) / TILE_SIZE),
               y: Math.floor((player.y + player.height / 2) / TILE_SIZE),
               intensity: 15
            });
         }
         state.lightMap = computeLighting(world, state.timeOfDay, startCol, startRow, endCol - startCol, endRow - startRow, extraLights);
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
               if (block === BlockType.QuestNPC || block === BlockType.GuideNPC || block === BlockType.GoblinNPC || block === BlockType.WizardNPC || block === BlockType.DurelNPC) {
                 let shirtColor = '#E91E63';
                 let skinColor = '#F8BBD0';
                 if (block === BlockType.GuideNPC) { shirtColor = '#4CAF50'; skinColor = '#FFE0B2'; }
                 else if (block === BlockType.GoblinNPC) { shirtColor = '#37474F'; skinColor = '#A5D6A7'; }
                 else if (block === BlockType.WizardNPC) { shirtColor = '#673AB7'; skinColor = '#E1BEE7'; }
                 ctx.fillStyle = skinColor; // skin
                 ctx.beginPath();
                 ctx.arc(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/3, TILE_SIZE/4, 0, Math.PI * 2);
                 ctx.fill();
                 ctx.fillStyle = shirtColor; // shirt
                 ctx.fillRect(x * TILE_SIZE + TILE_SIZE/4, y * TILE_SIZE + TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/2);
               } else if (false) {
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
             
               if (block === BlockType.Torch) {
                   const cx = x * TILE_SIZE + TILE_SIZE / 2;
                   const cy = y * TILE_SIZE + TILE_SIZE / 2;
                   const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, TILE_SIZE * 3);
                   grad.addColorStop(0, 'rgba(255, 200, 50, 0.4)');
                   grad.addColorStop(1, 'rgba(255, 200, 50, 0)');
                   ctx.fillStyle = grad;
                   ctx.fillRect(cx - TILE_SIZE * 3, cy - TILE_SIZE * 3, TILE_SIZE * 6, TILE_SIZE * 6);
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

      // Weather System (Rain/Snow)
      // Map time to a global deterministic cycle so all clients see similar weather
      const weatherCycle = (Date.now() * 0.00001) % 1; 
      const isRaining = weatherCycle > 0.6 && weatherCycle < 0.75;
      const isSnowing = weatherCycle >= 0.75 && weatherCycle < 0.9;
      
      if (isRaining) {
         for (let i = 0; i < 3; i++) {
             state.particles.push({
                 x: state.cameraX + Math.random() * dimensions.width,
                 y: state.cameraY - 20,
                 vx: -3 + Math.random(),
                 vy: 15 + Math.random() * 5,
                 life: 1, maxLife: 50,
                 color: 'rgba(150, 180, 255, 0.4)',
                 size: Math.random() * 2 + 1
             });
         }
      } else if (isSnowing) {
         for (let i = 0; i < 2; i++) {
             state.particles.push({
                 x: state.cameraX + Math.random() * dimensions.width,
                 y: state.cameraY - 20,
                 vx: Math.random() * 2 - 1,
                 vy: 3 + Math.random() * 2,
                 life: 1, maxLife: 120,
                 color: 'rgba(255, 255, 255, 0.8)',
                 size: Math.random() * 3 + 1
             });
         }
      }

      // Draw Projectiles
      for (const pId in state.projectiles) {
        const proj = state.projectiles[pId];
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(Math.atan2(proj.vy, proj.vx));
        
        if (proj.type === 'bullet') {
          ctx.fillStyle = '#FFC107'; // yellow
          ctx.fillRect(-4, -1, 8, 2);
        } else if (proj.type === 'arrow') {
          ctx.fillStyle = '#8D6E63'; // brown shaft
          ctx.fillRect(-6, -1, 12, 2);
          ctx.fillStyle = '#E0E0E0'; // white head
          ctx.beginPath();
          ctx.moveTo(6, -1);
          ctx.lineTo(10, 0);
          ctx.lineTo(6, 1);
          ctx.fill();
        } else if (proj.type === 'grenade') {
          ctx.fillStyle = '#2E7D32'; // dark green
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.type === 'fireball') {
          ctx.fillStyle = '#FF5722'; // orange
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#FFC107'; // yellow inner
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
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
        if (p.vy > 10 && p.color.includes('rgba(150, 180, 255')) { // Raining
           ctx.fillRect(p.x, p.y, p.size / 2, p.size * 5);
        } else {
           ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      }
      ctx.globalAlpha = 1.0;

      
      
      const drawPlayer = (pX: number, pY: number, pVx: number, facingRight: boolean, skin: string, name: string, tool: BlockType | null = null, isMining: boolean = false, isPartyMember: boolean = false, helmetTier: number | null = null, chestTier: number | null = null, attackTimer: number = 0) => {

        const pWidth = player.width;
        const pHeight = player.height;
        const isMoving = Math.abs(pVx) > 0.5;
        const walkCycle = isMoving ? Math.sin(timestamp * 0.015) * 5 : 0;
        
        let darkColor = '#E65100';
        let mainColor = '#FF9800';
        let armColor = '#F57C00';
        let headColor = '#FFE0B2';
        
        switch (skin) {
           case 'blue': darkColor = '#0D47A1'; mainColor = '#2196F3'; armColor = '#1976D2'; headColor = '#BBDEFB'; break;
           case 'green': darkColor = '#1B5E20'; mainColor = '#4CAF50'; armColor = '#388E3C'; headColor = '#C8E6C9'; break;
           case 'red': darkColor = '#B71C1C'; mainColor = '#F44336'; armColor = '#D32F2F'; headColor = '#FFCDD2'; break;
           case 'purple': darkColor = '#4A148C'; mainColor = '#9C27B0'; armColor = '#7B1FA2'; headColor = '#E1BEE7'; break;
           case 'pink': darkColor = '#880E4F'; mainColor = '#E91E63'; armColor = '#C2185B'; headColor = '#F8BBD0'; break;
           case 'gray': darkColor = '#212121'; mainColor = '#9E9E9E'; armColor = '#616161'; headColor = '#F5F5F5'; break;
           case 'orange': default: darkColor = '#E65100'; mainColor = '#FF9800'; armColor = '#F57C00'; headColor = '#FFE0B2'; break;
        }

        // Back Leg
        ctx.fillStyle = darkColor;
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
        ctx.fillStyle = mainColor; 
        ctx.fillRect(pX, pY + bodyYOffset, pWidth, pHeight - 6);
        
        // Head
        ctx.fillStyle = skin === 'blue' ? '#64B5F6' : '#FFB74D'; 
        ctx.fillRect(pX - 2, pY - 12 + bodyYOffset, pWidth + 4, 16);

        // Eyes
        ctx.fillStyle = '#000';
        const eyeOffset = facingRight ? 14 : 4;
        const headY = pY - 6 + bodyYOffset;
        ctx.fillRect(pX - 2 + eyeOffset, headY, 4, 4);
        ctx.fillRect(pX - 2 + eyeOffset + 6, headY, 4, 4);
        
        // Armor (Chestplate)
        if (chestTier !== null) {
            ctx.fillStyle = chestTier === 410 ? '#00ACC1' : (chestTier === 408 ? '#FBC02D' : '#BDBDBD');
            // Draw a plate over the chest
            ctx.fillRect(pX - 1, pY + bodyYOffset - 1, pWidth + 2, pHeight - 4);
        }
        
        // Armor (Helmet)
        if (helmetTier !== null) {
            ctx.fillStyle = helmetTier === 409 ? '#4DD0E1' : (helmetTier === 407 ? '#FFD54F' : '#9E9E9E');
            ctx.fillRect(pX - 3, pY - 13 + bodyYOffset, pWidth + 6, 8); // Top
            ctx.fillRect(pX - 3, pY - 5 + bodyYOffset, 4, 6); // Side
            ctx.fillRect(pX + pWidth - 1, pY - 5 + bodyYOffset, 4, 6); // Side
        }

        // Front Arm (holding tool)
        const armY = pY + 4 + bodyYOffset;
        const armX = facingRight ? pX + pWidth - 6 : pX - 2;
        
        ctx.save();

        ctx.translate(armX + 4, armY + 4);
        
        let armRotation = 0;
        if (attackTimer > 0) {
           // Smooth slash arc from up to down
           const progress = 1 - (attackTimer / 300); // 0 to 1
           armRotation = -Math.PI / 2 + (Math.PI * progress);
           if (!facingRight) armRotation = -armRotation;
        } else if (isMining) {
           // Standard mining bob
           armRotation = (Math.sin(timestamp * 0.03) * 0.8) - 0.4;
           if (!facingRight) armRotation = -armRotation;
        }
        ctx.rotate(armRotation);
        
        // Draw Arm
        ctx.fillStyle = armColor;
        ctx.fillRect(-4, -4, 8, 16);
        
        // Draw Tool
        if (tool !== null && tool !== BlockType.Fists && tool !== BlockType.Air) {
           ctx.translate(0, 10);
           const toolAngle = facingRight ? Math.PI / 4 : -Math.PI / 4;
           ctx.rotate(toolAngle);
           ctx.fillStyle = BlockColors[tool] || '#FFF';
           
           // Determine tool shape based on type
           const isSword = tool === BlockType.WoodSword || tool === BlockType.StoneSword || tool === BlockType.IronSword || tool === BlockType.GoldSword || tool === BlockType.DiamondSword;
           const isPickaxe = tool === BlockType.WoodPickaxe || tool === BlockType.StonePickaxe || tool === BlockType.IronPickaxe;
           const isAxe = tool === BlockType.WoodAxe || tool === BlockType.StoneAxe || tool === BlockType.IronAxe;
           const isGrapple = tool === BlockType.GrapplingHook;
           const isGun = tool === BlockType.Gun;
           const isBow = tool === BlockType.Bow;
           const isStaff = tool === BlockType.WizardStaff;
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
           } else if (isAxe) {
              // Axe shape
              ctx.fillStyle = '#8D6E63'; // Handle
              ctx.fillRect(-2, 0, 4, 16);
              ctx.fillStyle = BlockColors[tool]; // Head
              ctx.fillRect(facingRight ? 2 : -8, -8, 6, 8);
           } else if (isHoe) {
              // Hoe shape
              ctx.fillStyle = '#8D6E63'; // Handle
              ctx.fillRect(-2, 0, 4, 16);
              ctx.fillStyle = BlockColors[tool]; // Head
              ctx.fillRect(facingRight ? -2 : -8, -4, 10, 4);
           } else if (isGrapple) {
              ctx.fillStyle = '#455A64';
              ctx.fillRect(-2, -4, 4, 10);
              ctx.fillStyle = '#78909C';
              ctx.fillRect(-6, -8, 12, 4);
           } else if (isGun) {
              ctx.fillStyle = '#212121';
              ctx.fillRect(-4, -2, 12, 4);
              ctx.fillRect(-4, -2, 4, 8);
           } else if (isBow) {
              ctx.strokeStyle = '#8D6E63';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, 8, -Math.PI/2, Math.PI/2);
              ctx.stroke();
              ctx.strokeStyle = '#FFF';
              ctx.beginPath();
              ctx.moveTo(0, -8);
              ctx.lineTo(0, 8);
              ctx.stroke();
           } else if (isStaff) {
              ctx.fillStyle = '#5D4037';
              ctx.fillRect(-2, -10, 4, 20);
              ctx.fillStyle = '#9C27B0';
              ctx.beginPath();
              ctx.arc(0, -12, 4, 0, Math.PI*2);
              ctx.fill();
           } else {
              // Normal block
              if (tool < 100) {
                 ctx.fillRect(-6, -6, 12, 12);
              }
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
        other.vx *= 0.8; // dampen horizontal prediction to prevent sliding away on lag
        // Clamp to floor for prediction (crude)
        const topTy = Math.floor(other.y / TILE_SIZE);
        const botTy = Math.floor((other.y + player.height) / TILE_SIZE);
        const tx = Math.floor((other.x + player.width/2) / TILE_SIZE);
        if (world[tx] && world[tx][botTy] && world[tx][botTy] !== BlockType.Air) {
           other.vy = 0;
           other.y = botTy * TILE_SIZE - player.height - 0.01;
        }

        const isParty = propsRef.current.currentParty?.members?.includes(other.id);
        drawPlayer(other.x, other.y, other.vx, other.facingRight, (other as any).skin || 'blue', (other as any).name || other.id.substring(0, 4), other.tool, other.isMining, isParty, (other as any).helmet, (other as any).chest);
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
         if (item.type === 999) { // XP Orb
             ctx.shadowBlur = 10;
             ctx.shadowColor = '#4CAF50';
             ctx.fillStyle = '#B2FF59'; // Bright green/yellow glow
             ctx.beginPath();
             ctx.arc(0, 0, 4 + Math.sin(timestamp * 0.01) * 1.5, 0, Math.PI*2);
             ctx.fill();
             ctx.shadowBlur = 0;
         } else if (item.type === BlockType.CarrotSeed) ctx.fillRect(-2, -2, 4, 4);
         else if (item.type === BlockType.Apple) {
             ctx.beginPath();
             ctx.arc(0, 0, 6, 0, Math.PI*2);
             ctx.fill();
         } else ctx.fillRect(-6, -6, 12, 12);
         
         // Rarity Glow for dropped items
         if (item.type !== 999) {
             const legendaryTypes = [411, 405, 418, 409, 410]; // Boss Relic, Wizard Staff, Diamond gear
             const epicTypes = [412, 407, 408, 108]; // Gold gear, Bow
             const rareTypes = [104, 106, 401, 403, 300, 301, 303, 304]; // Iron gear, Bones, Bullet, Grenade
             if (legendaryTypes.includes(item.type)) {
                 ctx.shadowBlur = 20; ctx.shadowColor = '#FFB300'; // Amber/Gold
                 ctx.strokeStyle = '#FFCA28'; ctx.lineWidth = 2;
                 ctx.strokeRect(-8, -8, 16, 16);
                 ctx.shadowBlur = 0;
             } else if (epicTypes.includes(item.type)) {
                 ctx.shadowBlur = 15; ctx.shadowColor = '#E040FB'; // Purple
                 ctx.strokeStyle = '#E040FB'; ctx.lineWidth = 2;
                 ctx.strokeRect(-7, -7, 14, 14);
                 ctx.shadowBlur = 0;
             } else if (rareTypes.includes(item.type)) {
                 ctx.shadowBlur = 10; ctx.shadowColor = '#42A5F5'; // Blue
                 ctx.strokeStyle = '#64B5F6'; ctx.lineWidth = 1;
                 ctx.strokeRect(-7, -7, 14, 14);
                 ctx.shadowBlur = 0;
             }
         }
         
         ctx.restore();

         // Check collection distance
         const dist = Math.hypot(item.x + 8 - (player.x + player.width / 2), item.y + 8 - (player.y + player.height / 2));
         const canCollect = !item.spawnTime || Date.now() - item.spawnTime > 600;
         
         if (item.type === 999 && canCollect) {
            // XP orb: magnetic - attract toward player within 100px, collect at 28px
            if (dist < 100) {
              const angle = Math.atan2((player.y + player.height / 2) - (item.y + 8), (player.x + player.width / 2) - (item.x + 8));
              item.vx += Math.cos(angle) * 1.5;
              item.vy += Math.sin(angle) * 1.5;
              // cap speed
              const speed = Math.hypot(item.vx, item.vy);
              if (speed > 8) { item.vx = item.vx / speed * 8; item.vy = item.vy / speed * 8; }
            }
            if (dist < 28 && state.socket) {
              state.damageTexts.push({
                id: Math.random().toString(),
                x: item.x + 8,
                y: item.y - 10,
                damage: 10,
                text: '+10 XP',
                life: 0,
                maxLife: 40,
                color: '#4CAF50',
                size: 14,
                vx: 0,
                vy: -1.2,
                isCrit: false,
                scale: 1,
              });
              state.socket.emit('collect_item', item.id);
              delete state.items[item.id];
            }
         } else if (canCollect && dist < 32 && state.socket) {
            state.socket.emit('collect_item', item.id);
            delete state.items[item.id]; // optimistic
         }
      });

      
      // Draw mobs
      Object.values(state.mobs).forEach((mob: any) => {
         // Smoothly interpolate towards server authoritative position
         let isWalking = false;
         if (mob.targetX !== undefined) {
            if (Math.abs(mob.targetX - mob.x) > 1 || Math.abs(mob.targetY - mob.y) > 1) isWalking = true;
            mob.x += (mob.targetX - mob.x) * 0.3;
            mob.y += (mob.targetY - mob.y) * 0.3;
         }

         const walkOffset = isWalking ? Math.sin(timestamp * 0.015) * 4 : 0;
         const legOffset = isWalking ? Math.sin(timestamp * 0.015) * 8 : 0;

         ctx.save();
         ctx.translate(mob.x, mob.y + walkOffset);

         if (mob.type === 'zombie') {
            ctx.fillStyle = '#1b5e20'; // dark green skin
            ctx.fillRect(-2, -24, 28, 12); // head
            ctx.fillStyle = '#006064'; // cyan shirt
            ctx.fillRect(0, -12, 24, 24); // body
            ctx.fillStyle = '#3f51b5'; // blue pants
            ctx.fillRect(4, 12, 6, 12 + legOffset); // leg 1
            ctx.fillRect(14, 12, 6, 12 - legOffset); // leg 2
            
            ctx.fillStyle = '#000'; // eyes
            const eyeOffset = mob.facingRight ? 16 : 4;
            ctx.fillRect(-2 + eyeOffset, -20, 4, 4);
            ctx.fillRect(-2 + eyeOffset + 6, -20, 4, 4);
         } else if (mob.type === 'skeleton') {
            ctx.fillStyle = '#FF69B4'; // hot pink skeleton
            ctx.fillRect(0, -24, 24, 12); // head
            ctx.fillRect(8, -12, 8, 24); // spine
            ctx.fillRect(4, -8, 16, 4); // ribs
            ctx.fillRect(6, 12, 4, 12 + legOffset); // leg
            ctx.fillRect(14, 12, 4, 12 - legOffset); // leg
            ctx.fillStyle = '#000'; // eyes
            const eyeOffset = mob.facingRight ? 14 : 4;
            ctx.fillRect(eyeOffset, -20, 4, 4);
            ctx.fillRect(eyeOffset + 6, -20, 4, 4);
} else if (mob.type === 'wolf') {
            ctx.fillStyle = mob.ownerId ? '#E0E0E0' : '#9E9E9E'; // Lighter if tamed
            
            // Body
            ctx.fillRect(-8, -4, 24, 12);
            // Head
            ctx.fillRect(mob.facingRight ? 12 : -12, -12, 10, 10);
            // Snout
            ctx.fillStyle = '#616161';
            ctx.fillRect(mob.facingRight ? 20 : -16, -8, 6, 6);
            
            // Legs
            ctx.fillStyle = mob.ownerId ? '#BDBDBD' : '#757575';
            ctx.fillRect(-6, 8, 4, 16 + legOffset);
            ctx.fillRect(2, 8, 4, 16 - legOffset);
            ctx.fillRect(8, 8, 4, 16 + legOffset);
            ctx.fillRect(16, 8, 4, 16 - legOffset);

            // Collar if tamed
            if (mob.ownerId) {
                ctx.fillStyle = '#F44336';
                ctx.fillRect(mob.facingRight ? 12 : -12, -4, 10, 2);
            }
         } else if (mob.type === 'creeper') {
            ctx.fillStyle = '#2196F3'; // blue creeper
            ctx.fillRect(0, -24, 24, 24); // big head
            ctx.fillRect(4, 0, 16, 16); // body
            ctx.fillRect(-2, 16, 8, 8 + legOffset); // foot 1
            ctx.fillRect(18, 16, 8, 8 - legOffset); // foot 2
            ctx.fillStyle = '#000'; // creeper face
            ctx.fillRect(4, -18, 4, 4); // eye
            ctx.fillRect(16, -18, 4, 4); // eye
            ctx.fillRect(10, -14, 4, 6); // nose
            ctx.fillRect(6, -8, 12, 4); // mouth
         } else if (mob.type === 'slime') {
            ctx.fillStyle = 'rgba(139, 195, 74, 0.8)'; // translucent green
            // bounce effect for slime
            const slimeSquish = isWalking ? Math.abs(Math.sin(timestamp * 0.01)) * 6 : 0;
            ctx.fillRect(0, 0 + slimeSquish, 24, 24 - slimeSquish); // body
            ctx.fillStyle = '#fff';
            ctx.fillRect(4, 4 + slimeSquish, 4, 4); // eye
            ctx.fillRect(16, 4 + slimeSquish, 4, 4); // eye
         } else {
            // generic fallback
            ctx.fillStyle = '#607d8b';
            ctx.fillRect(0, -12, 24, 24);
            ctx.fillStyle = '#212121';
            ctx.fillRect(4, 12, 16, 12);
            ctx.fillStyle = '#ffcc80';
            ctx.fillRect(0, -24, 24, 12);
         }
         
         ctx.restore();
         
         // Draw HP bar above mob
         if (mob.hp !== undefined && mob.hp < (mob.maxHp || 10)) {
           const maxHp = mob.maxHp || (mob.type === 'golem_boss' ? 300 : 10);
           const hpRatio = Math.max(0, mob.hp / maxHp);
           const barW = 36;
           const barH = 5;
           const bx = mob.x - 6;
           const by = mob.y - 40;
           // Background
           ctx.fillStyle = 'rgba(0,0,0,0.6)';
           ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
           // Red empty
           ctx.fillStyle = '#5C0000';
           ctx.fillRect(bx, by, barW, barH);
           // Green filled
           const hpColor = hpRatio > 0.5 ? '#2ECC40' : hpRatio > 0.25 ? '#FF851B' : '#FF4136';
           ctx.fillStyle = hpColor;
           ctx.fillRect(bx, by, barW * hpRatio, barH);
           // mob name
           ctx.fillStyle = 'rgba(255,255,255,0.8)';
           ctx.font = 'bold 9px sans-serif';
           ctx.textAlign = 'center';
           ctx.fillText(mob.type?.toUpperCase() || 'MOB', mob.x + 12, mob.y - 43);
         }

      });
      // Draw local player
      
      // Handle Grapple Drawing and Physics
      if (state.grapplePoint && state.grappleTimer > 0) {
           ctx.beginPath();
           ctx.moveTo(player.x + player.width/2 - state.cameraX, player.y + player.height/2 - state.cameraY);
           ctx.lineTo(state.grapplePoint.x - state.cameraX, state.grapplePoint.y - state.cameraY);
           ctx.strokeStyle = '#FFFFFF';
           ctx.lineWidth = 2;
           ctx.stroke();
           
           const pullDx = state.grapplePoint.x - (player.x + player.width/2);
           const pullDy = state.grapplePoint.y - (player.y + player.height/2);
           const pullDist = Math.sqrt(pullDx*pullDx + pullDy*pullDy) || 1;
           
           // Jump out of grapple
           if (keysToUse['w'] || keysToUse['ArrowUp'] || keysToUse[' ']) {
               state.grapplePoint = null;
               player.isGrappling = false;
               player.vy = -7.5;
               player.grounded = false;
           } else {
               if (pullDist > 16) {
                   // Linear animation to the point
                   player.vx = (pullDx/pullDist) * 15;
                   player.vy = (pullDy/pullDist) * 15;
                   player.grounded = false;
                   player.isGrappling = true;
                   // Reset timer to keep pulling until we reach the point or jump
                   state.grappleTimer = 30; 
               } else {
                   player.vx = 0;
                   player.vy = 0;
                   player.isGrappling = true;
                   // Keep attached indefinitely
                   state.grappleTimer = 30;
               }
           }
      } else {
           player.isGrappling = false;
      }
      
      drawPlayer(player.x, player.y, player.vx, player.facingRight, propsRef.current.characterSkin || 'orange', propsRef.current.nickname || 'You', selectedBlock, state.miningProgress > 0 || state.interactionCooldown > 150, false, propsRef.current.helmet || null, propsRef.current.chestplate || null, state.interactionCooldown);

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

      // Draw Attack Effects (slash/punch VFX)
      for (let i = state.attackEffects.length - 1; i >= 0; i--) {
        const fx = state.attackEffects[i];
        fx.life++;
        const progress = fx.life / fx.maxLife; // 0 -> 1
        const alpha = 1 - progress;
        const sx = fx.x - state.cameraX;
        const sy = fx.y - state.cameraY;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(sx, sy);
        ctx.rotate(fx.facingRight ? -0.4 * progress * Math.PI : 0.4 * progress * Math.PI);
        
        if (fx.type === 'slash') {
          // Draw a slash arc
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3 - progress * 2;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#FF4444';
          ctx.beginPath();
          const arcDir = fx.facingRight ? 1 : -1;
          ctx.arc(0, 0, 20 + progress * 10, -Math.PI * 0.5 * arcDir, Math.PI * 0.3 * arcDir);
          ctx.stroke();
          // Second arc
          ctx.strokeStyle = '#FF4444';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 28 + progress * 8, -Math.PI * 0.4 * arcDir, Math.PI * 0.2 * arcDir);
          ctx.stroke();
        } else if (fx.type === 'punch') {
          // Draw a punch impact circle
          ctx.strokeStyle = '#FFA500';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#FFA500';
          const r = progress * 24;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
          // Star lines
          for (let line = 0; line < 5; line++) {
            const a = (line / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * (r * 0.5), Math.sin(a) * (r * 0.5));
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            ctx.stroke();
          }
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
        
        if (fx.life >= fx.maxLife) state.attackEffects.splice(i, 1);
      }

      // Draw Damage Texts (floating numbers)
      for (let i = state.damageTexts.length - 1; i >= 0; i--) {
        const dtTxt = state.damageTexts[i];
        dtTxt.life++;
        // Apply velocity
        dtTxt.y += (dtTxt.vy || -0.5);
        dtTxt.x += (dtTxt.vx || 0);
        dtTxt.vy = (dtTxt.vy || -0.5) * 0.95; // slow down
        dtTxt.vx = (dtTxt.vx || 0) * 0.92;
        
        const progress = dtTxt.life / dtTxt.maxLife;
        const alpha = progress > 0.6 ? 1 - ((progress - 0.6) / 0.4) : 1; // fade out last 40%
        const scale = dtTxt.isCrit ? (1 + (1 - progress) * 0.5) : 1; // crits pop in big then shrink
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(dtTxt.x - state.cameraX, dtTxt.y - state.cameraY);
        ctx.scale(scale, scale);
        
        const fontSize = dtTxt.size || 15;
        ctx.font = `bold ${fontSize}px 'Arial Black', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const displayTxt = dtTxt.text ? dtTxt.text : (dtTxt.isCrit ? `💥 ${dtTxt.damage}!` : `-${dtTxt.damage}`);
        
        // Text shadow / stroke for readability
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(displayTxt, 0, 0);
        ctx.fillStyle = dtTxt.color || '#FF5555';
        ctx.fillText(displayTxt, 0, 0);
        
        // "CRIT!" label above for critical hits
        if (dtTxt.isCrit && dtTxt.life < 20) {
          ctx.font = 'bold 9px sans-serif';
          ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.lineWidth = 2;
          ctx.strokeText('CRITICAL!', 0, -fontSize - 4);
          ctx.fillStyle = '#FFD700';
          ctx.fillText('CRITICAL!', 0, -fontSize - 4);
        }
        
        ctx.restore();
        
        if (dtTxt.life >= dtTxt.maxLife) {
          state.damageTexts.splice(i, 1);
        }

      }

      ctx.restore();

      if (state.showMap && world.length > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const mapScale = Math.min(canvas.width / world.length, canvas.height / world[0].length) * 0.9;
        const mapWidth = world.length * mapScale;
        const mapHeight = world[0].length * mapScale;
        const mapX = (canvas.width - mapWidth) / 2;
        const mapY = (canvas.height - mapHeight) / 2;
        
        ctx.fillStyle = 'black';
        ctx.fillRect(mapX, mapY, mapWidth, mapHeight);
        
        for (let x = 0; x < world.length; x++) {
          for (let y = 0; y < world[0].length; y++) {
            if (state.explored[x] && state.explored[x][y]) {
              const b = world[x][y];
              if (b !== BlockType.Air) {
                ctx.fillStyle = BlockColors[b] || 'gray';
              } else {
                ctx.fillStyle = '#87CEEB';
              }
              // Add a tiny bit of overlap to avoid seams
              ctx.fillRect(mapX + x * mapScale, mapY + y * mapScale, mapScale + 0.5, mapScale + 0.5);
            }
          }
        }
        
        // Draw player dot
        ctx.fillStyle = 'red';
        const px = Math.floor(player.x / TILE_SIZE);
        const py = Math.floor(player.y / TILE_SIZE);
        ctx.fillRect(mapX + px * mapScale - mapScale, mapY + py * mapScale - mapScale, mapScale * 3, mapScale * 3);
        
        // Draw other players
        ctx.fillStyle = 'orange';
        for (const opId in state.otherPlayers) {
          const op = state.otherPlayers[opId];
          const ox = Math.floor(op.x / TILE_SIZE);
          const oy = Math.floor(op.y / TILE_SIZE);
          ctx.fillRect(mapX + ox * mapScale - mapScale, mapY + oy * mapScale - mapScale, mapScale * 3, mapScale * 3);
        }
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MAP', canvas.width / 2, mapY - 20);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('toss_item', handleToss);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-crosshair overflow-hidden group">
      <canvas 
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block"
      />

    </div>
  );
}
