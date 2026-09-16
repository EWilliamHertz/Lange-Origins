import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const replacement = `
         if (mob.type === 'zombie') {
            ctx.fillStyle = '#1b5e20'; // dark green skin
            ctx.fillRect(mob.x - 2, mob.y - 24, 28, 12); // head
            ctx.fillStyle = '#006064'; // cyan shirt
            ctx.fillRect(mob.x, mob.y - 12, 24, 24); // body
            ctx.fillStyle = '#3f51b5'; // blue pants
            ctx.fillRect(mob.x + 4, mob.y + 12, 16, 12); // legs
            ctx.fillStyle = '#000'; // eyes
            const eyeOffset = mob.facingRight ? 16 : 4;
            ctx.fillRect(mob.x - 2 + eyeOffset, mob.y - 20, 4, 4);
            ctx.fillRect(mob.x - 2 + eyeOffset + 6, mob.y - 20, 4, 4);
         } else if (mob.type === 'skeleton') {
            ctx.fillStyle = '#eeeeee'; // white bones
            ctx.fillRect(mob.x, mob.y - 24, 24, 12); // head
            ctx.fillRect(mob.x + 8, mob.y - 12, 8, 24); // spine
            ctx.fillRect(mob.x + 4, mob.y - 8, 16, 4); // ribs
            ctx.fillRect(mob.x + 6, mob.y + 12, 4, 12); // leg
            ctx.fillRect(mob.x + 14, mob.y + 12, 4, 12); // leg
            ctx.fillStyle = '#000'; // eyes
            const eyeOffset = mob.facingRight ? 14 : 4;
            ctx.fillRect(mob.x + eyeOffset, mob.y - 20, 4, 4);
            ctx.fillRect(mob.x + eyeOffset + 6, mob.y - 20, 4, 4);
         } else if (mob.type === 'creeper') {
            ctx.fillStyle = '#4caf50'; // bright green
            ctx.fillRect(mob.x, mob.y - 24, 24, 24); // big head
            ctx.fillRect(mob.x + 4, mob.y, 16, 16); // body
            ctx.fillRect(mob.x - 2, mob.y + 16, 8, 8); // foot 1
            ctx.fillRect(mob.x + 18, mob.y + 16, 8, 8); // foot 2
            ctx.fillStyle = '#000'; // creeper face
            ctx.fillRect(mob.x + 4, mob.y - 18, 4, 4); // eye
            ctx.fillRect(mob.x + 16, mob.y - 18, 4, 4); // eye
            ctx.fillRect(mob.x + 10, mob.y - 14, 4, 6); // nose
            ctx.fillRect(mob.x + 6, mob.y - 8, 12, 4); // mouth
         } else if (mob.type === 'slime') {
            ctx.fillStyle = 'rgba(139, 195, 74, 0.8)'; // translucent green
            ctx.fillRect(mob.x, mob.y, 24, 24); // body
            ctx.fillStyle = '#fff';
            ctx.fillRect(mob.x + 4, mob.y + 4, 4, 4); // eye
            ctx.fillRect(mob.x + 16, mob.y + 4, 4, 4); // eye
         } else {
            // generic fallback
            ctx.fillStyle = '#607d8b';
            ctx.fillRect(mob.x, mob.y - 12, 24, 24);
            ctx.fillStyle = '#212121';
            ctx.fillRect(mob.x + 4, mob.y + 12, 16, 12);
            ctx.fillStyle = '#ffcc80';
            ctx.fillRect(mob.x, mob.y - 24, 24, 12);
         }
`;

code = code.replace(/if \(mob\.type === 'rival_thug'\) \{[\s\S]*?\} else \{[\s\S]*?ctx\.fillRect\(mob\.x, mob\.y - 24, 24, 12\);\n         \}/, replacement.trim());

fs.writeFileSync('src/components/GameCanvas.tsx', code);
