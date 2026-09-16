const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const targetMobCode = `
      // Draw mobs
      Object.values(state.mobs).forEach((mob: any) => {
         // Smoothly interpolate towards server authoritative position
         if (mob.targetX !== undefined) {
            mob.x += (mob.targetX - mob.x) * 0.3;
            mob.y += (mob.targetY - mob.y) * 0.3;
         }

         if (mob.type === 'zombie') {
`;

const replaceMobCode = `
      // Draw mobs
      Object.values(state.mobs).forEach((mob: any) => {
         // Smoothly interpolate towards server authoritative position
         let isWalking = false;
         if (mob.targetX !== undefined) {
            if (Math.abs(mob.targetX - mob.x) > 1 || Math.abs(mob.targetY - mob.y) > 1) isWalking = true;
            mob.x += (mob.targetX - mob.x) * 0.3;
            mob.y += (mob.targetY - mob.y) * 0.3;
         }

         const walkOffset = isWalking ? Math.sin(timestamp * 0.015) * 4 : 0;
         const legOffset = isWalking ? Math.sin(timestamp * 0.015) * 8 : 0;

         ctx.save();
         ctx.translate(mob.x, mob.y + walkOffset);

         if (mob.type === 'zombie') {
            ctx.fillStyle = '#1b5e20'; // dark green skin
            ctx.fillRect(-2, -24, 28, 12); // head
            ctx.fillStyle = '#006064'; // cyan shirt
            ctx.fillRect(0, -12, 24, 24); // body
            ctx.fillStyle = '#3f51b5'; // blue pants
            ctx.fillRect(4, 12, 6, 12 + legOffset); // leg 1
            ctx.fillRect(14, 12, 6, 12 - legOffset); // leg 2
            
            ctx.fillStyle = '#000'; // eyes
            const eyeOffset = mob.facingRight ? 16 : 4;
            ctx.fillRect(-2 + eyeOffset, -20, 4, 4);
            ctx.fillRect(-2 + eyeOffset + 6, -20, 4, 4);
         } else if (mob.type === 'skeleton') {
            ctx.fillStyle = '#eeeeee'; // white bones
            ctx.fillRect(0, -24, 24, 12); // head
            ctx.fillRect(8, -12, 8, 24); // spine
            ctx.fillRect(4, -8, 16, 4); // ribs
            ctx.fillRect(6, 12, 4, 12 + legOffset); // leg
            ctx.fillRect(14, 12, 4, 12 - legOffset); // leg
            ctx.fillStyle = '#000'; // eyes
            const eyeOffset = mob.facingRight ? 14 : 4;
            ctx.fillRect(eyeOffset, -20, 4, 4);
            ctx.fillRect(eyeOffset + 6, -20, 4, 4);
         } else if (mob.type === 'creeper') {
            ctx.fillStyle = '#4caf50'; // bright green
            ctx.fillRect(0, -24, 24, 24); // big head
            ctx.fillRect(4, 0, 16, 16); // body
            ctx.fillRect(-2, 16, 8, 8 + legOffset); // foot 1
            ctx.fillRect(18, 16, 8, 8 - legOffset); // foot 2
            ctx.fillStyle = '#000'; // creeper face
            ctx.fillRect(4, -18, 4, 4); // eye
            ctx.fillRect(16, -18, 4, 4); // eye
            ctx.fillRect(10, -14, 4, 6); // nose
            ctx.fillRect(6, -8, 12, 4); // mouth
         } else if (mob.type === 'slime') {
            ctx.fillStyle = 'rgba(139, 195, 74, 0.8)'; // translucent green
            // bounce effect for slime
            const slimeSquish = isWalking ? Math.abs(Math.sin(timestamp * 0.01)) * 6 : 0;
            ctx.fillRect(0, 0 + slimeSquish, 24, 24 - slimeSquish); // body
            ctx.fillStyle = '#fff';
            ctx.fillRect(4, 4 + slimeSquish, 4, 4); // eye
            ctx.fillRect(16, 4 + slimeSquish, 4, 4); // eye
         } else {
            // generic fallback
            ctx.fillStyle = '#607d8b';
            ctx.fillRect(0, -12, 24, 24);
            ctx.fillStyle = '#212121';
            ctx.fillRect(4, 12, 16, 12);
            ctx.fillStyle = '#ffcc80';
            ctx.fillRect(0, -24, 24, 12);
         }
         
         ctx.restore();
`;

let targetMobCodeEnd = `
         } else {
            // generic fallback
            ctx.fillStyle = '#607d8b';
            ctx.fillRect(mob.x, mob.y - 12, 24, 24);
            ctx.fillStyle = '#212121';
            ctx.fillRect(mob.x + 4, mob.y + 12, 16, 12);
            ctx.fillStyle = '#ffcc80';
            ctx.fillRect(mob.x, mob.y - 24, 24, 12);
         }
      });
`;

let idxStart = code.indexOf('// Draw mobs');
let idxEnd = code.indexOf('      // Draw local player');

if (idxStart !== -1 && idxEnd !== -1) {
    let replaced = code.substring(0, idxStart) + replaceMobCode + "\n      });\n" + code.substring(idxEnd);
    fs.writeFileSync('src/components/GameCanvas.tsx', replaced);
    console.log("Success");
} else {
    console.log("Failed to find boundaries");
}
