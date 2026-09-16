const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldHandle = `  const handleFireWeapon = (weaponType: number) => {
    const isGun = weaponType === 302;
    const isBow = weaponType === 109;
    const isGrenade = weaponType === 304;`;

const newHandle = `  const handleFireWeapon = (weaponType: number) => {
    const isGun = weaponType === BlockType.Gun;
    const isBow = weaponType === BlockType.Bow;
    const isGrenade = weaponType === BlockType.Grenade;
    const isStaff = weaponType === BlockType.WizardStaff;
    
    if (isStaff) {
       setMana(prev => Math.max(0, prev - 10));
       return;
    }`;

code = code.replace(oldHandle, newHandle);

fs.writeFileSync('src/App.tsx', code);
console.log('App patched for mana reduction.');
