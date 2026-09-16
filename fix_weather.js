import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const anchor = `      // Draw Projectiles`;

const insertion = `      // Weather System (Rain/Snow)
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

      // Draw Projectiles`;

code = code.replace(anchor, insertion);

// Let's also adjust the rendering of particles so they look like rain (elongated)
const particleDrawAnchor = `        ctx.globalAlpha = 1 - (p.life / p.maxLife);
        ctx.fillRect(p.x, p.y, p.size, p.size);`;

const newParticleDraw = `        ctx.globalAlpha = 1 - (p.life / p.maxLife);
        if (p.vy > 10 && p.color.includes('rgba(150, 180, 255')) { // Raining
           ctx.fillRect(p.x, p.y, p.size / 2, p.size * 5);
        } else {
           ctx.fillRect(p.x, p.y, p.size, p.size);
        }`;

code = code.replace(particleDrawAnchor, newParticleDraw);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
