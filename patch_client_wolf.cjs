const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const renderWolf = `
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
`;

code = code.replace(
  "         } else if (mob.type === 'creeper') {",
  renderWolf.trim() + "\n         } else if (mob.type === 'creeper') {"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Client wolf rendering patched.');
