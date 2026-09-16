import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const regex = /         if \(mob\.type === 'zombie'\) \{[\s\S]*?            ctx\.fillRect\(mob\.facingRight \? mob\.x \+ 10 : mob\.x - 2, mob\.y - 8, 14, 5\);\n         \}/;

const newRender = `         if (mob.type === 'zombie') {
            ctx.fillStyle = '#2E7D32'; // dark green body
            ctx.fillRect(mob.x, mob.y - 12, 24, 36);
            ctx.fillStyle = '#388E3C'; // head
            ctx.fillRect(mob.x - 2, mob.y - 24, 28, 12);
            // eyes
            ctx.fillStyle = '#000';
            const eyeOffset = mob.facingRight ? 16 : 4;
            ctx.fillRect(mob.x - 2 + eyeOffset, mob.y - 20, 4, 4);
            ctx.fillRect(mob.x - 2 + eyeOffset + 6, mob.y - 20, 4, 4);
            // arms
            ctx.fillStyle = '#1B5E20';
            ctx.fillRect(mob.facingRight ? mob.x + 12 : mob.x - 4, mob.y - 8, 16, 6);
         } else {
            // Slime
            ctx.fillStyle = '#4CAF50';
            // pulse based on time
            const pulse = Math.sin(timestamp * 0.01) * 2;
            ctx.fillRect(mob.x, mob.y - pulse, 24, 24 + pulse);
            
            // Eyes
            ctx.fillStyle = '#000';
            const eyeOffset = mob.facingRight ? 12 : 4;
            ctx.fillRect(mob.x + eyeOffset, mob.y + 6 - pulse, 4, 4);
            ctx.fillRect(mob.x + eyeOffset + 6, mob.y + 6 - pulse, 4, 4);
         }`;

code = code.replace(regex, newRender);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
