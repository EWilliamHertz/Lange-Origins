import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/selectedSlot/g, "selectedSlotIndex");
fs.writeFileSync('src/App.tsx', code);

let code2 = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');
code2 = code2.replace(/currentAmmoCount, currentAmmoCount/g, "currentAmmoCount");
fs.writeFileSync('src/components/GameCanvas.tsx', code2);
