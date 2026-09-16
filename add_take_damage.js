import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const listener = `
    socket.on('take_damage', (data: { damage: number, vx: number, vy: number }) => {
      const p = gameState.current.player;
      if (p.invulnerableTimer <= 0) {
          const mitigation = (propsRef.current.helmet ? 0.3 : 0) + (propsRef.current.chestplate ? 0.3 : 0);
          const finalDamage = Math.max(1, Math.floor(data.damage * (1 - mitigation)));
          p.health = Math.max(0, p.health - finalDamage);
          p.invulnerableTimer = 60;
          p.vx = data.vx;
          p.vy = data.vy;
      }
    });

    socket.on('damage_indicator', (data: { id: string, x: number, y: number, damage: number }) => {
`;

code = code.replace(/socket\.on\('damage_indicator', \(data: \{ id: string, x: number, y: number, damage: number \}\) => \{/, listener);

// also update mob touch damage
const mobTouch = `
                            if (intersectX && intersectY && (mob.type === 'rival_thug' || mob.type === 'slime' || mob.type === 'skeleton' || mob.type === 'creeper')) {
                               const baseDmg = (mob.type === 'creeper') ? 30 : (mob.type === 'skeleton' ? 10 : 5);
                               const mitigation = (propsRef.current.helmet ? 0.3 : 0) + (propsRef.current.chestplate ? 0.3 : 0);
                               const finalDamage = Math.max(1, Math.floor(baseDmg * (1 - mitigation)));
                               
                               player.health = Math.max(0, player.health - finalDamage);
                               player.invulnerableTimer = 60; // 1 second i-frames
`;

code = code.replace(/if \(intersectX && intersectY && \(mob\.type === 'rival_thug' \|\| mob\.type === 'slime' \|\| mob\.type === 'skeleton' \|\| mob\.type === 'creeper'\)\) \{\s*player\.health = Math\.max\(0, player\.health - 1\);\s*player\.invulnerableTimer = 60; \/\/ 1 second i-frames/, mobTouch);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
