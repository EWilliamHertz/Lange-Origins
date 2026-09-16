import { BlockType, SolidBlocks, PlatformBlocks, TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from './constants';
import { World } from './world';

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
  invulnerableTimer: number;
}

const GRAVITY = 0.4;
const MAX_FALL_SPEED = 18; // Increased for fall damage
const MAX_SPEED = 2.5; // Reduced from 3.5
const ACCELERATION = 0.5; // Reduced from 0.8
const FRICTION = 0.8;
const JUMP_POWER = -7.5; // Slightly reduced jump to match speed

export function updatePhysics(player: PlayerState, world: World, keys: Record<string, boolean>, speedBonus: number = 0) {
  if (player.invulnerableTimer > 0) player.invulnerableTimer--;

  // Movement Input
  if (keys['a'] || keys['ArrowLeft']) {
    player.vx -= ACCELERATION;
    player.facingRight = false;
  }
  if (keys['d'] || keys['ArrowRight']) {
    player.vx += ACCELERATION;
    player.facingRight = true;
  }
  
  // Jumping
  if ((keys['w'] || keys['ArrowUp'] || keys[' ']) && player.grounded) {
    player.vy = JUMP_POWER;
    player.grounded = false;
  }

  // Falling through platforms
  const isHoldingDown = keys['s'] || keys['ArrowDown'];

  // Friction when no input
  if (!keys['a'] && !keys['ArrowLeft'] && !keys['d'] && !keys['ArrowRight']) {
    player.vx *= FRICTION;
  }

  // Velocity Clamping
  const currentMaxSpeed = MAX_SPEED + (speedBonus * 0.25);
  // Instead of hard clamping, we apply friction if we're over max speed
  // This allows impulses (like from the Grappling Hook) to briefly exceed max speed.
  if (player.vx > currentMaxSpeed) {
      if (!keys['a'] && !keys['ArrowLeft'] && !keys['d'] && !keys['ArrowRight']) {
          // already applying friction
      } else {
          // If they are inputting, we still slowly drag them back to max speed
          player.vx *= 0.95;
      }
  } else if (player.vx < -currentMaxSpeed) {
      if (!keys['a'] && !keys['ArrowLeft'] && !keys['d'] && !keys['ArrowRight']) {
          // already applying friction
      } else {
          player.vx *= 0.95;
      }
  }
  if (Math.abs(player.vx) < 0.1) player.vx = 0;

  // Gravity
  player.vy += GRAVITY;
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
        if (x < 0 || x >= WORLD_WIDTH || y >= WORLD_HEIGHT) {
          return true; // World bounds act as solid
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
      
      // Fall Damage Check
      if (oldVy > 14) {
        const damage = Math.floor((oldVy - 14) * 0.8);
        if (damage > 0 && player.invulnerableTimer <= 0) {
          player.health -= damage;
          player.invulnerableTimer = 30;
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
}
