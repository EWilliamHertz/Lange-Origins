import re

content = open('src/App.tsx').read()
start_idx = content.find("const handleKeyDown = (e: KeyboardEvent) => {")
end_idx = content.find("window.addEventListener('keydown', handleKeyDown);", start_idx)

new_fn = """const handleKeyDown = (e: KeyboardEvent) => {
      if (appState !== 'playing') return;
      
      if (isChatOpen) {
        if (e.key === 'Escape') {
          setIsChatOpen(false);
        }
        if (e.key !== 'Escape') {
          return; // Disable other game keys while chatting unless it's escape
        }
      }

      if (e.key === 'Enter') {
        setIsChatOpen(true);
        setTimeout(() => chatInputRef.current?.focus(), 50);
        return;
      }
      
      if (e.key.toLowerCase() === 'e') {
        if (merchantOpen) {
          setMerchantOpen(false);
          setCursorItem(null);
          return;
        }
        if (furnaceOpen) {
          setFurnaceOpen(false);
          setCursorItem(null);
          return;
        }
        if (chestOpen) {
          setChestOpen(false);
          setActiveChestCoords(null);
          if (cursorItem) returnCursorItemToInventory(cursorItem);
          return;
        }
        if (npcDialog) {
          setNpcDialog(null);
          return;
        }
        setInventoryOpen(prev => {
          if (prev && cursorItem) returnCursorItemToInventory(cursorItem);
          return !prev;
        });
        setQuestLogOpen(false);
        return;
      }
      
      if (e.key.toLowerCase() === 'q') {
        if (!inventoryOpen && !furnaceOpen && !isChatOpen) {
          setQuestLogOpen(prev => !prev);
        }
        return;
      }
      
      if (hoveredSlotRef.current && (inventoryOpen || (!inventoryOpen && !isChatOpen))) {
        if (hoveredSlotRef.current.type === 'ability') {
           const key = e.key.toLowerCase();
           if (key !== 'escape' && key !== 'tab' && key !== 'e' && key !== 'enter') {
               setKeybinds(prev => {
                   const next = { ...prev };
                   for (const k in next) if (next[k] === hoveredSlotRef.current.index) delete next[k];
                   next[key] = hoveredSlotRef.current.index;
                   return next;
               });
           }
           return;
        }
        
        const hRef = hoveredSlotRef.current;
        const isActionBar = ['hotbar', 'leftActionBar', 'rightActionBar'].includes(hRef.type);
        if (isActionBar) {
            const targetArr = hRef.type === 'hotbar' ? [...hotbar] : hRef.type === 'leftActionBar' ? [...leftActionBar] : [...rightActionBar];
            const slot = targetArr[hRef.index];
            const pressedKey = e.key.toLowerCase();
            
            // If hovering an existing ability, bind it to the new key!
            if (slot && typeof slot === 'object' && slot.isAbility && pressedKey !== 'escape' && pressedKey !== 'tab' && pressedKey !== 'e' && pressedKey !== 'enter') {
                setKeybinds(prev => {
                    const next = { ...prev };
                    for (const k in next) if (next[k] === slot.abilityId) delete next[k];
                    next[pressedKey] = slot.abilityId;
                    return next;
                });
                return;
            }
            
            // If empty or non-ability, and we pressed a key that is bound to an ability, put it in!
            const boundAbility = keybinds[pressedKey];
            if (boundAbility) {
                targetArr[hRef.index] = { isAbility: true, abilityId: boundAbility };
                if (hRef.type === 'hotbar') setHotbar(targetArr);
                if (hRef.type === 'leftActionBar') setLeftActionBar(targetArr);
                if (hRef.type === 'rightActionBar') setRightActionBar(targetArr);
                return;
            }
        }
      }

      if (!inventoryOpen && !furnaceOpen && !questLogOpen && !npcDialog) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          setSelectedSlotIndex(num - 1);
        }
      } else if (inventoryOpen && hoveredSlotRef.current) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
           const hotbarIdx = num - 1;
           const hRef = hoveredSlotRef.current;
           window.dispatchEvent(new CustomEvent('swap_hotbar', { detail: { hotbarIdx, type: hRef.type, index: hRef.index } }));
        }
      }
    };
    """

open('src/App.tsx', 'w').write(content[:start_idx] + new_fn + content[end_idx:])
