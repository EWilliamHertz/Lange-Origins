import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldAppDep = `  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (appState !== 'playing' || document.activeElement?.tagName === 'INPUT') return;
      
      if (e.key === 'e' || e.key === 'E') {
        if (!furnaceOpen && !chestOpen && !merchantOpen) {
           setInventoryOpen(prev => !prev);
        } else {
           setFurnaceOpen(false);
           setChestOpen(false);
           setMerchantOpen(false);
           setInventoryOpen(false);
        }
      }
      if (e.key === 't' || e.key === 'T' || e.key === 'Enter') {
        e.preventDefault();
        setIsChatOpen(true);
        setTimeout(() => chatInputRef.current?.focus(), 10);
      }
      if (e.key === 'Escape') {
        setInventoryOpen(false);
        setFurnaceOpen(false);
        setChestOpen(false);
        setIsChatOpen(false);
        setMerchantOpen(false);
      }
      if (e.key === 'q' || e.key === 'Q') {
         if (hotbar[selectedSlotIndex]) {
             window.dispatchEvent(new CustomEvent('toss_item', { detail: { type: hotbar[selectedSlotIndex].type, count: 1 }}));
             setHotbar(prev => {
                const newBar = [...prev];
                const slot = newBar[selectedSlotIndex];
                if (slot) {
                   if (slot.count > 1) {
                      newBar[selectedSlotIndex] = { ...slot, count: slot.count - 1 };
                   } else {
                      newBar[selectedSlotIndex] = null;
                   }
                }
                return newBar;
             });
         }
      }
      
      if (!inventoryOpen && !furnaceOpen && !chestOpen && !isChatOpen && !merchantOpen) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          setSelectedSlotIndex(num - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, inventoryOpen, furnaceOpen, isChatOpen]);`;

const newAppDep = `  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (appState !== 'playing' || document.activeElement?.tagName === 'INPUT') return;
      
      if (e.key === 'e' || e.key === 'E') {
        if (!furnaceOpen && !chestOpen && !merchantOpen) {
           setInventoryOpen(prev => !prev);
        } else {
           setFurnaceOpen(false);
           setChestOpen(false);
           setMerchantOpen(false);
           setInventoryOpen(false);
        }
      }
      if (e.key === 't' || e.key === 'T' || e.key === 'Enter') {
        e.preventDefault();
        setIsChatOpen(true);
        setTimeout(() => chatInputRef.current?.focus(), 10);
      }
      if (e.key === 'Escape') {
        setInventoryOpen(false);
        setFurnaceOpen(false);
        setChestOpen(false);
        setIsChatOpen(false);
        setMerchantOpen(false);
      }
      if (e.key === 'q' || e.key === 'Q') {
         setHotbar(prev => {
             const slot = prev[selectedSlotIndex];
             if (slot) {
                 window.dispatchEvent(new CustomEvent('toss_item', { detail: { type: slot.type, count: 1 }}));
                 const newBar = [...prev];
                 if (slot.count > 1) {
                    newBar[selectedSlotIndex] = { ...slot, count: slot.count - 1 };
                 } else {
                    newBar[selectedSlotIndex] = null;
                 }
                 return newBar;
             }
             return prev;
         });
      }
      
      if (!inventoryOpen && !furnaceOpen && !chestOpen && !isChatOpen && !merchantOpen) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          setSelectedSlotIndex(num - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, inventoryOpen, furnaceOpen, chestOpen, isChatOpen, merchantOpen, selectedSlotIndex]);`;

code = code.replace(oldAppDep, newAppDep);
fs.writeFileSync('src/App.tsx', code);
