const fs = require('fs');
let code = fs.readFileSync('src/lib/physics.ts', 'utf8');

code = code.replace(
  "export function updatePhysics(player: PlayerState, world: World, keys: Record<string, boolean>) {",
  "export function updatePhysics(player: PlayerState, world: World, keys: Record<string, boolean>, speedBonus: number = 0) {"
);

code = code.replace(
  "if (player.vx > MAX_SPEED) player.vx = MAX_SPEED;\n  if (player.vx < -MAX_SPEED) player.vx = -MAX_SPEED;",
  "const currentMaxSpeed = MAX_SPEED + (speedBonus * 0.5);\n  if (player.vx > currentMaxSpeed) player.vx = currentMaxSpeed;\n  if (player.vx < -currentMaxSpeed) player.vx = -currentMaxSpeed;"
);

fs.writeFileSync('src/lib/physics.ts', code);
console.log('Fixed physics speed');
