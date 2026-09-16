import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const regex = /         if \(mob\.type === 'zombie'\) \{[\s\S]*?            ctx\.fillRect\(mob\.x \+ eyeOffset \+ 6, mob\.y \+ 6 - pulse, 4, 4\);\n         \}/;

const gangsterRender = `         if (mob.type === 'rival_thug') {
            ctx.fillStyle = '#b71c1c'; // red shirt
            ctx.fillRect(mob.x, mob.y - 12, 24, 24);
            ctx.fillStyle = '#424242'; // pants
            ctx.fillRect(mob.x + 4, mob.y + 12, 16, 12);
            ctx.fillStyle = '#ffb74d'; // skin head
            ctx.fillRect(mob.x - 2, mob.y - 24, 28, 12);
            // eyes/shades
            ctx.fillStyle = '#000';
            const eyeOffset = mob.facingRight ? 16 : 4;
            ctx.fillRect(mob.x - 2 + eyeOffset, mob.y - 20, 8, 4);
         } else if (mob.type === 'prostitute') {
            ctx.fillStyle = '#e91e63'; // pink dress
            ctx.fillRect(mob.x + 2, mob.y - 12, 20, 24);
            ctx.fillStyle = '#ffcc80'; // skin
            ctx.fillRect(mob.x, mob.y - 24, 24, 12);
            // hair
            ctx.fillStyle = '#fdd835'; 
            ctx.fillRect(mob.x, mob.y - 28, 24, 6);
            ctx.fillRect(mob.facingRight ? mob.x : mob.x + 20, mob.y - 24, 4, 12);
         } else {
            // Client
            ctx.fillStyle = '#607d8b'; // grey suit
            ctx.fillRect(mob.x, mob.y - 12, 24, 24);
            ctx.fillStyle = '#212121'; // pants
            ctx.fillRect(mob.x + 4, mob.y + 12, 16, 12);
            ctx.fillStyle = '#ffcc80'; // skin
            ctx.fillRect(mob.x, mob.y - 24, 24, 12);
         }`;

code = code.replace(regex, gangsterRender);

// Wait, I also need to fix the mTop and hit detection
code = code.replace(/if \(intersectX && intersectY\)/, "if (intersectX && intersectY && mob.type === 'rival_thug')");
code = code.replace(/const mTop = mob\.type === 'zombie' \? mob\.y - 24 : mob\.y - 12;/g, "const mTop = mob.y - 24;");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
