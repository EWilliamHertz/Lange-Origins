import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const isWpnOld = `        const isGun = propsRef.current.selectedBlock === 302; // Gun
        const isBow = propsRef.current.selectedBlock === 109; // Bow
        const isGrenade = propsRef.current.selectedBlock === 304; // Grenade

        if ((isGun || isBow || isGrenade) && state.interactionCooldown <= 0 && state.socket) {
             if ((propsRef.current.currentAmmoCount || 0) <= 0) {
                 state.interactionCooldown = 500;
                 state.damageTexts.push({ id: Math.random().toString(), text: 'No Ammo!', x: player.x, y: player.y - 15, life: 1, maxLife: 40, color: '#FF3333', size: 14 });
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
        }`;

const isWpnNew = `        const isGun = propsRef.current.selectedBlock === 302; // Gun
        const isBow = propsRef.current.selectedBlock === 109; // Bow
        const isGrenade = propsRef.current.selectedBlock === 304; // Grenade
        const isStaff = propsRef.current.selectedBlock === 406; // Magic Staff

        if ((isGun || isBow || isGrenade || isStaff) && state.interactionCooldown <= 0 && state.socket) {
             if (!isStaff && (propsRef.current.currentAmmoCount || 0) <= 0) {
                 state.interactionCooldown = 500;
                 state.damageTexts.push({ id: Math.random().toString(), text: 'No Ammo!', x: player.x, y: player.y - 15, life: 1, maxLife: 40, color: '#FF3333', size: 14 });
             } else {
                 const dx = (targetTx * 32 + 16) - player.x;
                 const dy = (targetTy * 32 + 16) - player.y;
                 const mDist = Math.sqrt(dx*dx + dy*dy) || 1;
                 const speed = isGun ? 25 : (isBow ? 15 : (isStaff ? 20 : 10));
                 const vx = (dx / mDist) * speed;
                 const vy = (dy / mDist) * speed;
                 const type = isGun ? 'bullet' : (isBow ? 'arrow' : (isStaff ? 'magic' : 'grenade'));
                 
                 state.socket.emit('fire_projectile', { type, x: player.x, y: player.y - 12, vx, vy });
                 state.interactionCooldown = isGun ? 100 : (isBow ? 300 : (isStaff ? 250 : 400));
                 
                 if (!isStaff && propsRef.current.onFireWeapon && propsRef.current.selectedBlock !== null) {
                     propsRef.current.onFireWeapon(propsRef.current.selectedBlock);
                 }
             }
        }`;

code = code.replace(isWpnOld, isWpnNew);

const drawProjOld = `        } else if (proj.type === 'grenade') {
          ctx.fillStyle = '#2E7D32'; // dark green
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();`;

const drawProjNew = `        } else if (proj.type === 'grenade') {
          ctx.fillStyle = '#2E7D32'; // dark green
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.type === 'magic') {
          ctx.fillStyle = '#E040FB'; // bright purple
          ctx.shadowColor = '#9C27B0';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();`;

code = code.replace(drawProjOld, drawProjNew);
fs.writeFileSync('src/components/GameCanvas.tsx', code);
