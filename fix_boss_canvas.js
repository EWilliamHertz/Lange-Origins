import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const drawMobOld = `      // Draw mobs
      for (const mobId in state.mobs) {
         const mob = state.mobs[mobId];
         if (!mob.health) mob.health = mob.hp;
         if (mob.health <= 0) continue;
         
         const x = mob.x;
         const y = mob.y;
         const isHit = mob.invulnerableTimer && mob.invulnerableTimer > 0;
         
         ctx.save();
         ctx.translate(x + 12, y + 12);
         if (!mob.facingRight) ctx.scale(-1, 1);
         
         if (mob.type === 'slime') {`;

const drawMobNew = `      // Draw mobs
      for (const mobId in state.mobs) {
         const mob = state.mobs[mobId];
         if (!mob.health) mob.health = mob.hp;
         if (mob.health <= 0) continue;
         
         const x = mob.x;
         const y = mob.y;
         const isHit = mob.invulnerableTimer && mob.invulnerableTimer > 0;
         
         ctx.save();
         const isBoss = mob.type === 'golem_boss';
         ctx.translate(x + (isBoss ? 48 : 12), y + (isBoss ? 48 : 12));
         if (!mob.facingRight) ctx.scale(-1, 1);
         
         if (mob.type === 'slime') {`;

code = code.replace(drawMobOld, drawMobNew);

const drawMobZomb = `         } else if (mob.type === 'zombie') {
            // Draw zombie
            ctx.fillStyle = isHit ? 'red' : '#388E3C';
            ctx.fillRect(-12, -12, 24, 24);
            ctx.fillStyle = isHit ? 'red' : '#1565C0';
            ctx.fillRect(-12, 12, 24, 24);
            
            // Eyes
            ctx.fillStyle = 'black';
            ctx.fillRect(4, -6, 4, 4);
         }
         ctx.restore();`;

const drawMobBoss = `         } else if (mob.type === 'zombie') {
            // Draw zombie
            ctx.fillStyle = isHit ? 'red' : '#388E3C';
            ctx.fillRect(-12, -12, 24, 24);
            ctx.fillStyle = isHit ? 'red' : '#1565C0';
            ctx.fillRect(-12, 12, 24, 24);
            
            // Eyes
            ctx.fillStyle = 'black';
            ctx.fillRect(4, -6, 4, 4);
         } else if (mob.type === 'golem_boss') {
            // Draw giant golem boss
            ctx.fillStyle = isHit ? 'red' : '#1A237E';
            ctx.fillRect(-32, -48, 64, 48); // Huge torso
            ctx.fillStyle = isHit ? 'red' : '#311B92';
            ctx.fillRect(-24, 0, 48, 48); // Huge legs
            
            // Glowing eyes
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(8, -32, 12, 8);
            
            // Health bar for boss
            ctx.fillStyle = 'black';
            ctx.fillRect(-40, -64, 80, 8);
            ctx.fillStyle = '#E91E63';
            ctx.fillRect(-39, -63, 78 * (mob.health / 300), 6);
         }
         ctx.restore();`;

code = code.replace(drawMobZomb, drawMobBoss);


const bossHitboxOld = `           for (const mId in state.mobs) {
               const m = state.mobs[mId];
               if (m.health && m.health > 0) {
                  const mx = m.x + 12;
                  const my = m.y + 12;
                  const dist = Math.hypot(mx - px, my - py);`;

const bossHitboxNew = `           for (const mId in state.mobs) {
               const m = state.mobs[mId];
               if (m.health && m.health > 0) {
                  const isBoss = m.type === 'golem_boss';
                  const mx = m.x + (isBoss ? 48 : 12);
                  const my = m.y + (isBoss ? 48 : 12);
                  const dist = Math.hypot(mx - px, my - py);`;

code = code.replace(bossHitboxOld, bossHitboxNew);

const bossRangeOld = `                  if (dist < 48) {`;
const bossRangeNew = `                  if (dist < (m.type === 'golem_boss' ? 96 : 48)) {`;
code = code.replace(bossRangeOld, bossRangeNew);


const bossDmgOld = `                               const baseDmg = (mob.type === 'creeper') ? 14 : (mob.type === 'skeleton' ? 5 : 3); // Creeper=7 hearts, Skeleton=2.5 hearts, Slime=1.5 hearts
                               const mitigation = (propsRef.current.helmet ? 0.3 : 0) + (propsRef.current.chestplate ? 0.3 : 0);
                               const finalDamage = Math.max(1, Math.floor(baseDmg * (1 - mitigation)));`;

const bossDmgNew = `                               const baseDmg = (mob.type === 'golem_boss') ? 20 : (mob.type === 'creeper') ? 14 : (mob.type === 'skeleton' ? 5 : 3);
                               const mitigation = (propsRef.current.helmet ? 0.3 : 0) + (propsRef.current.chestplate ? 0.3 : 0);
                               const finalDamage = Math.max(1, Math.floor(baseDmg * (1 - mitigation)));`;

code = code.replace(bossDmgOld, bossDmgNew);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
