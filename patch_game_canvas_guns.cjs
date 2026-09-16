const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(
  "const isGun = propsRef.current.selectedBlock === 302; // Gun",
  "const isGun = propsRef.current.selectedBlock === BlockType.Gun; // Gun"
);
code = code.replace(
  "const isBow = propsRef.current.selectedBlock === 109; // Bow",
  "const isBow = propsRef.current.selectedBlock === BlockType.Bow; // Bow"
);
code = code.replace(
  "const isGrenade = propsRef.current.selectedBlock === 304; // Grenade",
  "const isGrenade = propsRef.current.selectedBlock === BlockType.Grenade; // Grenade\n        const isStaff = propsRef.current.selectedBlock === BlockType.WizardStaff; // Staff"
);

code = code.replace(
  "if ((isGun || isBow || isGrenade) && state.interactionCooldown <= 0 && state.socket) {",
  "if ((isGun || isBow || isGrenade || isStaff) && state.interactionCooldown <= 0 && state.socket) {"
);

const oldTypeCode = "const type = isGun ? 'bullet' : (isBow ? 'arrow' : 'grenade');";
const newTypeCode = `const type = isGun ? 'bullet' : (isBow ? 'arrow' : (isStaff ? 'fireball' : 'grenade'));
                 
                 if (isStaff) {
                     // Requires mana check in parent, but we will send mana decrease event
                     if ((propsRef.current.mana || 0) < 10) {
                        state.interactionCooldown = 500;
                        state.damageTexts.push({ id: Math.random().toString(), text: 'No Mana!', x: player.x, y: player.y - 15, life: 1, maxLife: 40, color: '#4444FF', size: 14 });
                        return; // cancel shot
                     }
                 }`;

code = code.replace(oldTypeCode, newTypeCode);

code = code.replace(
  "state.interactionCooldown = isGun ? 100 : (isBow ? 300 : 400);",
  "state.interactionCooldown = isGun ? 100 : (isBow ? 300 : (isStaff ? 250 : 400));"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('GameCanvas patched for staves');
