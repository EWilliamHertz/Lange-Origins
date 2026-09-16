import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const oldCode = `        if ((isGun || isBow || isGrenade) && state.interactionCooldown <= 0 && state.socket) {
             if ((propsRef.current.currentAmmoCount || 0) <= 0) {
                 state.interactionCooldown = 300;
             } else {`;

const newCode = `        if ((isGun || isBow || isGrenade) && state.interactionCooldown <= 0 && state.socket) {
             if ((propsRef.current.currentAmmoCount || 0) <= 0) {
                 state.interactionCooldown = 500;
                 state.damageTexts.push({ id: Math.random().toString(), text: 'No Ammo!', x: player.x, y: player.y - 15, life: 1, maxLife: 40, color: '#FF3333', size: 14 });
             } else {`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/GameCanvas.tsx', code);
