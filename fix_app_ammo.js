import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const ammoHandler = `
  const handleFireWeapon = (weaponType: number) => {
    // Determine ammo type
    const isGun = weaponType === 302;
    const isBow = weaponType === 109;
    const isGrenade = weaponType === 304;
    
    let ammoType = isGun ? 303 : (isBow ? 110 : 304); // Bullet, Arrow, Grenade
    
    // Find and consume ammo in hotbar or backpack
    let consumed = false;
    
    if (isGrenade) {
       // Grenades consume themselves, so we just decrement the currently selected slot if it's the grenade
       setHotbar(prev => {
          const newHb = [...prev];
          const currentSlot = newHb[selectedSlot];
          if (currentSlot && currentSlot.type === 304) {
             currentSlot.count--;
             if (currentSlot.count <= 0) newHb[selectedSlot] = null;
          }
          return newHb;
       });
       return;
    }
    
    // Consume from hotbar
    setHotbar(prev => {
       const newHb = [...prev];
       for (let i = 0; i < newHb.length; i++) {
           if (newHb[i] && newHb[i].type === ammoType) {
               newHb[i].count--;
               if (newHb[i].count <= 0) newHb[i] = null;
               consumed = true;
               return newHb;
           }
       }
       return prev;
    });
    
    if (!consumed) {
       setBackpack(prev => {
           const newBp = [...prev];
           for (let i = 0; i < newBp.length; i++) {
               if (newBp[i] && newBp[i].type === ammoType) {
                   newBp[i].count--;
                   if (newBp[i].count <= 0) newBp[i] = null;
                   return newBp;
               }
           }
           return prev;
       });
    }
  };
`;

code = code.replace(/const handleSlotClick = /, ammoHandler + "\n  const handleSlotClick = ");

code = code.replace(/onBlockCollect=\{handleBlockCollect\}/, "onBlockCollect={handleBlockCollect}\n          onFireWeapon={handleFireWeapon}");

fs.writeFileSync('src/App.tsx', code);
