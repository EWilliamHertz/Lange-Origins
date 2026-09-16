const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const hook = `        const isGrenade = propsRef.current.selectedBlock === BlockType.Grenade; // Grenade
        const isStaff = propsRef.current.selectedBlock === BlockType.WizardStaff; // Staff
        const isGrapple = propsRef.current.selectedBlock === BlockType.GrapplingHook; // Grapple

        if (isGrapple && state.interactionCooldown <= 0) {
            const dx = (targetTx * 32 + 16) - player.x;
            const dy = (targetTy * 32 + 16) - player.y;
            const mDist = Math.sqrt(dx*dx + dy*dy) || 1;
            const maxRange = 600; // max grapple distance
            if (mDist < maxRange) {
               // Raycast
               let steps = Math.floor(mDist);
               let hit = false;
               let hx = 0; let hy = 0;
               for (let i = 0; i < steps; i+=4) {
                   const cx = player.x + (dx/mDist) * i;
                   const cy = player.y + (dy/mDist) * i;
                   const gTx = Math.floor(cx / 32);
                   const gTy = Math.floor(cy / 32);
                   if (gTx >= 0 && gTx < world.length && gTy >= 0 && gTy < world[0].length) {
                       const bType = world[gTx][gTy];
                       if (SolidBlocks.has(bType)) {
                           hit = true;
                           hx = cx;
                           hy = cy;
                           break;
                       }
                   }
               }
               if (hit) {
                   // Pull player
                   const pullDx = hx - player.x;
                   const pullDy = hy - player.y;
                   const pullDist = Math.sqrt(pullDx*pullDx + pullDy*pullDy) || 1;
                   player.vx += (pullDx/pullDist) * 20; // impulse instead of absolute set to allow swinging
                   player.vy += (pullDy/pullDist) * 20;
                   if (player.vy < -25) player.vy = -25;
                   if (player.vx < -25) player.vx = -25;
                   if (player.vx > 25) player.vx = 25;
                   
                   player.grounded = false;
                   state.damageTexts.push({ id: Math.random().toString(), text: 'Swoosh!', x: player.x, y: player.y - 15, life: 1, maxLife: 30, color: '#DDDDDD', size: 12 });
                   state.interactionCooldown = 400;
               } else {
                   state.damageTexts.push({ id: Math.random().toString(), text: 'Miss!', x: player.x, y: player.y - 15, life: 1, maxLife: 30, color: '#FF4444', size: 12 });
                   state.interactionCooldown = 200;
               }
            } else {
                state.damageTexts.push({ id: Math.random().toString(), text: 'Too far!', x: player.x, y: player.y - 15, life: 1, maxLife: 30, color: '#FF4444', size: 12 });
                state.interactionCooldown = 200;
            }
        }`;

code = code.replace(
  "        const isGrenade = propsRef.current.selectedBlock === BlockType.Grenade; // Grenade\n        const isStaff = propsRef.current.selectedBlock === BlockType.WizardStaff; // Staff",
  hook
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('GameCanvas grapple logic patched');
