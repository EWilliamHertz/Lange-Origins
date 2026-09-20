import { BlockType, SolidBlocks, PlatformBlocks, TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from './constants';
import { World } from './world';
import { loadKeybinds } from './keybinds';

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  grounded: boolean;
  facingRight: boolean;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  isSprinting?: boolean;
  invulnerableTimer: number;
  isGrappling?: boolean;
}

const GRAVITY = 0.4;
const MAX_FALL_SPEED = 18; // Increased for fall damage
const SPRINT_MAX_SPEED = 2.5; // The previous standard speed is now the sprint speed
const WALK_MAX_SPEED = 1.3; // Significantly reduced for deliberate, steady walking
const SPRINT_ACCELERATION = 0.5; // Responsive sprint burst
const WALK_ACCELERATION = 0.22; // Controlled, smooth walk acceleration
const FRICTION = 0.8;
const JUMP_POWER = -7.5; // Slightly reduced jump to match speed

export function updatePhysics(player: PlayerState, world: World, keys: Record<string, boolean>, speedBonus: number = 0) {
  if (player.invulnerableTimer > 0) player.invulnerableTimer--;

  // Initialize stamina if needed
  if (player.stamina === undefined) player.stamina = 100;
  if (player.maxStamina === undefined) player.maxStamina = 100;

  // Custom keybinds
  const binds = loadKeybinds();
  const leftKey = binds.moveLeft?.toLowerCase() || 'a';
  const rightKey = binds.moveRight?.toLowerCase() || 'd';
  const jumpKey = binds.jump?.toLowerCase() || 'w';
  const dropKey = binds.dropPlatform?.toLowerCase() || 's';
  const sprintKey = binds.sprint?.toLowerCase() || 'shift';

  // Movement Input Checks
  const isMovingLeft = Boolean(keys['a'] || keys['ArrowLeft'] || keys[leftKey]);
  const isMovingRight = Boolean(keys['d'] || keys['ArrowRight'] || keys[rightKey]);
  const isMovingHorizontally = isMovingLeft || isMovingRight;
  const isShiftPressed = Boolean(keys['shift'] || keys['Shift'] || keys['ShiftLeft'] || keys['ShiftRight'] || keys[sprintKey]);

  // Sprinting evaluation: Shift held, moving horizontally, and has stamina
  const canSprint = isShiftPressed && isMovingHorizontally && player.stamina > 1.5;

  if (canSprint) {
    player.isSprinting = true;
    // Drain stamina while sprinting (~21 per second at 60fps)
    player.stamina = Math.max(0, player.stamina - 0.35);
    if (player.stamina <= 0) {
      player.isSprinting = false;
    }
  } else {
    player.isSprinting = false;
    // Regenerate stamina when not sprinting
    if (!isShiftPressed) {
      if (!isMovingHorizontally && Math.abs(player.vx) < 0.2) {
        // Faster recharge while resting stationary (~24/sec)
        player.stamina = Math.min(player.maxStamina, player.stamina + 0.4);
      } else {
        // Steady recharge while walking (~15/sec)
        player.stamina = Math.min(player.maxStamina, player.stamina + 0.25);
      }
    }
  }

  // Active acceleration & max speed based on sprint vs walk
  const currentAccel = player.isSprinting ? SPRINT_ACCELERATION : WALK_ACCELERATION;
  const baseMaxSpeed = player.isSprinting ? SPRINT_MAX_SPEED : WALK_MAX_SPEED;
  const currentMaxSpeed = baseMaxSpeed + (speedBonus * (player.isSprinting ? 0.25 : 0.12));

  if (isMovingLeft) {
    player.vx -= currentAccel;
    player.facingRight = false;
  }
  if (isMovingRight) {
    player.vx += currentAccel;
    player.facingRight = true;
  }
  
  // Jumping
  const isJumping = Boolean(keys['w'] || keys['ArrowUp'] || keys[' '] || keys[jumpKey]);
  if (isJumping && player.grounded) {
    player.vy = JUMP_POWER;
    player.grounded = false;
    // Small stamina consumption on sprint jump
    if (player.isSprinting && player.stamina >= 3) {
      player.stamina -= 3;
    }
  }

  // Falling through platforms
  const isHoldingDown = Boolean(keys['s'] || keys['ArrowDown'] || keys[dropKey]);

  // Friction when no input
  if (!isMovingHorizontally) {
    player.vx *= FRICTION;
  }

  // Velocity Clamping & Drag
  // When above max speed (e.g. dropping out of sprint, or grapple boost), apply smooth drag
  if (player.vx > currentMaxSpeed) {
      if (!isMovingHorizontally) {
          // already applying friction
      } else {
          player.vx *= 0.94;
      }
  } else if (player.vx < -currentMaxSpeed) {
      if (!isMovingHorizontally) {
          // already applying friction
      } else {
          player.vx *= 0.94;
      }
  }
  if (Math.abs(player.vx) < 0.05) player.vx = 0;

  // Gravity
  if (!player.isGrappling) {
    player.vy += GRAVITY;
  }
  // Soft clamp fall speed so upward grapple momentum isn't broken
  if (player.vy > MAX_FALL_SPEED) {
      player.vy -= (player.vy - MAX_FALL_SPEED) * 0.1; 
  }

  // Collision Helper
  const checkCollision = (newX: number, newY: number, checkingY: boolean = false) => {
    const left = Math.floor(newX / TILE_SIZE);
    const right = Math.floor((newX + player.width - 0.01) / TILE_SIZE);
    const top = Math.floor(newY / TILE_SIZE);
    const bottom = Math.floor((newY + player.height - 0.01) / TILE_SIZE);

    for (let x = left; x <= right; x++) {
      for (let y = top; y <= bottom; y++) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) {
          return true; // World bounds act as solid (top AND bottom)
        }
        const block = world[x][y];
        if (SolidBlocks.has(block)) {
          return true;
        }
        
        // Platform collision logic
        if (PlatformBlocks.has(block)) {
          // Platforms only collide if we are moving downwards, checking Y-axis,
          // not holding down, and our previous bottom was above the platform top.
          if (checkingY && player.vy > 0 && !isHoldingDown) {
             const prevBottom = player.y + player.height;
             const platformTop = y * TILE_SIZE;
             // Allow a small margin to catch fast falls
             if (prevBottom - player.vy <= platformTop + 0.01) {
                return true;
             }
          }
        }
      }
    }
    return false;
  };

  // Move X
  player.x += player.vx;
  if (checkCollision(player.x, player.y, false)) {
    // Try auto-stepping up by 1 tile
    const stepY = player.y - TILE_SIZE;
    if (player.grounded || player.vy >= 0) {
       if (!checkCollision(player.x, stepY, false)) {
         player.y = stepY;
       } else {
         if (player.vx > 0) { 
           player.x = Math.floor((player.x + player.width) / TILE_SIZE) * TILE_SIZE - player.width - 0.01;
         } else if (player.vx < 0) {
           player.x = Math.floor(player.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE + 0.01;
         }
         player.vx = 0;
       }
    } else {
      if (player.vx > 0) {
        player.x = Math.floor((player.x + player.width) / TILE_SIZE) * TILE_SIZE - player.width - 0.01;
      } else if (player.vx < 0) {
        player.x = Math.floor(player.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE + 0.01;
      }
      player.vx = 0;
    }
  }

  // Move Y
  const oldVy = player.vy;
  player.y += player.vy;
  player.grounded = false;
  
  if (checkCollision(player.x, player.y, true)) {
    if (player.vy > 0) { // Hit ground
      player.y = Math.floor((player.y + player.height) / TILE_SIZE) * TILE_SIZE - player.height - 0.01;
      player.grounded = true;
      
      // Fall Damage Check (only for high terminal velocity drops, not small platform falls)
      if (oldVy > 20) {
        const damage = Math.floor((oldVy - 20) * 0.7);
        if (damage > 0 && player.invulnerableTimer <= 0) {
          player.health -= damage;
          player.invulnerableTimer = 40;
        }
      }
    } else if (player.vy < 0) { // Hit ceiling
      player.y = Math.floor(player.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE + 0.01;
    }
    player.vy = 0;
  }
  
  // Hazard Check (Lava)
  const cx = Math.floor((player.x + player.width / 2) / TILE_SIZE);
  const cyFeet = Math.floor((player.y + player.height - 2) / TILE_SIZE); 
  const cyBody = Math.floor((player.y + player.height / 2) / TILE_SIZE);
  
  if (
     (world[cx]?.[cyFeet] === BlockType.Lava) ||
     (world[cx]?.[cyBody] === BlockType.Lava)
  ) {
     if (player.invulnerableTimer <= 0) {
        player.health -= 2;
        player.invulnerableTimer = 40;
     }
  }

  // Safety clamp: Prevent falling off world bounds into infinity
  if (player.y < 0) {
    player.y = 0;
    if (player.vy < 0) player.vy = 0;
  } else if (player.y > (WORLD_HEIGHT - 2) * TILE_SIZE) {
    player.y = (WORLD_HEIGHT - 3) * TILE_SIZE;
    player.vy = 0;
  }
}