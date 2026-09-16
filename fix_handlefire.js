import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldFunc = `  const handleFireWeapon = (weaponType: number) => {
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
          const currentSlot = newHb[selectedSlotIndex];
          if (currentSlot && currentSlot.type === 304) {
             currentSlot.count--;
             if (currentSlot.count <= 0) newHb[selectedSlotIndex] = null;
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
  };`;

const newFunc = `  const handleFireWeapon = (weaponType: number) => {
    const isGun = weaponType === 302;
    const isBow = weaponType === 109;
    const isGrenade = weaponType === 304;
    
    let ammoType = isGun ? 303 : (isBow ? 110 : 304);
    
    if (isGrenade) {
       setHotbar(prev => {
          const newHb = [...prev];
          const currentSlot = newHb[selectedSlotIndex];
          if (currentSlot && currentSlot.type === 304) {
             newHb[selectedSlotIndex] = { ...currentSlot, count: currentSlot.count - 1 };
             if (newHb[selectedSlotIndex]?.count <= 0) newHb[selectedSlotIndex] = null;
          }
          return newHb;
       });
       return;
    }
    
    setHotbar(prevHotbar => {
       const newHb = [...prevHotbar];
       let consumed = false;
       for (let i = 0; i < newHb.length; i++) {
           if (newHb[i] && newHb[i].type === ammoType) {
               newHb[i] = { ...newHb[i]!, count: newHb[i]!.count - 1 };
               if (newHb[i]!.count <= 0) newHb[i] = null;
               consumed = true;
               return newHb;
           }
       }
       
       if (!consumed) {
           setBackpack(prevBp => {
               const newBp = [...prevBp];
               for (let j = 0; j < newBp.length; j++) {
                   if (newBp[j] && newBp[j].type === ammoType) {
                       newBp[j] = { ...newBp[j]!, count: newBp[j]!.count - 1 };
                       if (newBp[j]!.count <= 0) newBp[j] = null;
                       return newBp;
                   }
               }
               return prevBp;
           });
       }
       return prevHotbar;
    });
  };`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/App.tsx', code);
