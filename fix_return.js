import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const oldCode = `        if ((isGun || isBow || isGrenade) && state.interactionCooldown <= 0 && state.socket) {
             if ((propsRef.current.currentAmmoCount || 0) <= 0) return;
             const dx = (targetTx * 32 + 16) - player.x;
             const dy = (targetTy * 32 + 16) - player.y;
             const mDist = Math.sqrt(dx*dx + dy*dy) || 1;
             const speed = isGun ? 25 : (isBow ? 15 : 10);
             const vx = (dx / mDist) * speed;
             const vy = (dy / mDist) * speed;
             const type = isGun ? 'bullet' : (isBow ? 'arrow' : 'grenade');
             
             state.socket.emit('fire_projectile', { type, x: player.x, y: player.y - 12, vx, vy });
             state.interactionCooldown = isGun ? 100 : (isBow ? 300 : 400); // 100ms for gun, 300 for bow, 400 for grenade
             
             // Deduct ammo locally logic could go here, or we let a React prop handle it
             if (propsRef.current.onFireWeapon) {
                 propsRef.current.onFireWeapon(propsRef.current.selectedBlock);
             }
        }
        else if (state.interactionCooldown <= 0) {`;

const newCode = `        if ((isGun || isBow || isGrenade) && state.interactionCooldown <= 0 && state.socket) {
             if ((propsRef.current.currentAmmoCount || 0) <= 0) {
                 state.interactionCooldown = 300;
             } else {
                 const dx = (targetTx * 32 + 16) - player.x;
                 const dy = (targetTy * 32 + 16) - player.y;
                 const mDist = Math.sqrt(dx*dx + dy*dy) || 1;
                 const speed = isGun ? 25 : (isBow ? 15 : 10);
                 const vx = (dx / mDist) * speed;
                 const vy = (dy / mDist) * speed;
                 const type = isGun ? 'bullet' : (isBow ? 'arrow' : 'grenade');
                 
                 state.socket.emit('fire_projectile', { type, x: player.x, y: player.y - 12, vx, vy });
                 state.interactionCooldown = isGun ? 100 : (isBow ? 300 : 400);
                 
                 if (propsRef.current.onFireWeapon && propsRef.current.selectedBlock !== null) {
                     propsRef.current.onFireWeapon(propsRef.current.selectedBlock);
                 }
             }
        }
        else if (state.interactionCooldown <= 0) {`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/GameCanvas.tsx', code);
