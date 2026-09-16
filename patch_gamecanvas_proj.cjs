const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const oldProjCode = `        } else if (proj.type === 'grenade') {
          ctx.fillStyle = '#2E7D32'; // dark green
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }`;

const newProjCode = `        } else if (proj.type === 'grenade') {
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
      }`;

code = code.replace(oldProjCode, newProjCode);
fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('GameCanvas projectiles patched.');
