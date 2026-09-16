const fs = require('fs');
let code = fs.readFileSync('src/lib/physics.ts', 'utf8');

const target = `  // Velocity Clamping
  const currentMaxSpeed = MAX_SPEED + (speedBonus * 0.5);
  if (player.vx > currentMaxSpeed) player.vx = currentMaxSpeed;
  if (player.vx < -currentMaxSpeed) player.vx = -currentMaxSpeed;`;

const replacement = `  // Velocity Clamping
  const currentMaxSpeed = MAX_SPEED + (speedBonus * 0.5);
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
  }`;

code = code.replace(target, replacement);

const fallTarget = `  // Gravity
  player.vy += GRAVITY;
  if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;`;

const fallReplacement = `  // Gravity
  player.vy += GRAVITY;
  // Soft clamp fall speed so upward grapple momentum isn't broken
  if (player.vy > MAX_FALL_SPEED) {
      player.vy -= (player.vy - MAX_FALL_SPEED) * 0.1; 
  }`;

code = code.replace(fallTarget, fallReplacement);
fs.writeFileSync('src/lib/physics.ts', code);
console.log('Fixed physics for grappling hook');
