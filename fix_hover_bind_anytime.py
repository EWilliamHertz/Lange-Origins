lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "if (!inventoryOpen && !furnaceOpen && !questLogOpen && !npcDialog) {" in lines[i]:
        insert_code = """
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
        """
        lines.insert(i, insert_code)
        break
        
for i in range(len(lines)):
    if "} else if (inventoryOpen && hoveredSlotRef.current) {" in lines[i]:
        # we need to remove the old block
        end_idx = i
        while "const num = parseInt(e.key);" not in lines[end_idx]:
            end_idx += 1
        del lines[i:end_idx]
        break

open('src/App.tsx', 'w').write('\n'.join(lines))
