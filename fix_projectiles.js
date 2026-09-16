import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const particlesRendering = `
      // Update & Draw Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {`;

const projectilesRendering = `
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
        }
        ctx.restore();
      }

      // Update & Draw Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {`;

code = code.replace(particlesRendering, projectilesRendering);

// also fix App.tsx to pass onFireWeapon
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/onGangInvite=\{\(senderId, senderName\) => addNotification\('gang', senderId, senderName\)\}/, "onGangInvite={(senderId, senderName) => addNotification('gang', senderId, senderName)}\n          onFireWeapon={handleFireWeapon}");
fs.writeFileSync('src/App.tsx', appCode);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
