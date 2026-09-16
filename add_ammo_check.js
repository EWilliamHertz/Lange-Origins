import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const ammoCountLogic = `
  const countAmmo = (type: number) => {
      let count = 0;
      hotbar.forEach(s => { if(s && s.type === type) count += s.count; });
      backpack.forEach(s => { if(s && s.type === type) count += s.count; });
      return count;
  };
  const currentAmmoCount = 
      selectedBlock === 302 ? countAmmo(303) :
      selectedBlock === 109 ? countAmmo(110) :
      selectedBlock === 304 ? countAmmo(304) : 1;
`;

code = code.replace(/<GameCanvas/, ammoCountLogic + "\n        <GameCanvas\n          currentAmmoCount={currentAmmoCount}");

fs.writeFileSync('src/App.tsx', code);

let code2 = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');
code2 = code2.replace(/onFireWeapon\?: \(weaponType: number\) => void;/, "onFireWeapon?: (weaponType: number) => void;\n  currentAmmoCount?: number;");
code2 = code2.replace(/onFireWeapon \}: GameProps/, "onFireWeapon, currentAmmoCount }: GameProps");
code2 = code2.replace(/onFireWeapon,/, "onFireWeapon, currentAmmoCount,");
code2 = code2.replace(/if \(\(isGun \|\| isBow \|\| isGrenade\) && state\.interactionCooldown <= 0 && state\.socket\) \{/, "if ((isGun || isBow || isGrenade) && state.interactionCooldown <= 0 && state.socket) {\n             if ((propsRef.current.currentAmmoCount || 0) <= 0) return;");
fs.writeFileSync('src/components/GameCanvas.tsx', code2);
