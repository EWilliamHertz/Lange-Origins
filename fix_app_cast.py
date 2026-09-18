lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "if (!inventoryOpen && !furnaceOpen && !questLogOpen && !npcDialog) {" in lines[i]:
        insert_code = """
      if (!inventoryOpen && !furnaceOpen && !questLogOpen && !npcDialog) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          const slot = hotbar[num - 1];
          if (slot && typeof slot === 'object' && slot.isAbility) {
             window.dispatchEvent(new CustomEvent('cast_ability', { detail: { abilityId: slot.abilityId } }));
          } else {
             setSelectedSlotIndex(num - 1);
          }
        }
      } else if (inventoryOpen && hoveredSlotRef.current) {
        """
        # we need to replace the old block up to the window.dispatchEvent
        end_idx = i
        while "window.dispatchEvent(new CustomEvent('swap_hotbar'" not in lines[end_idx]:
            end_idx += 1
        end_idx += 2 # get past the swap_hotbar and closing braces
        del lines[i:end_idx+1]
        lines.insert(i, insert_code)
        
        # re-insert the swap hotbar part since we deleted it
        lines.insert(i+1, "        const num = parseInt(e.key);")
        lines.insert(i+2, "        if (num >= 1 && num <= 9) {")
        lines.insert(i+3, "           const hotbarIdx = num - 1;")
        lines.insert(i+4, "           const hRef = hoveredSlotRef.current;")
        lines.insert(i+5, "           window.dispatchEvent(new CustomEvent('swap_hotbar', { detail: { hotbarIdx, type: hRef.type, index: hRef.index } }));")
        lines.insert(i+6, "        }")
        lines.insert(i+7, "      }")
        break

# Now for onClick on left/right action bars!
# we will use `handleSlotClick` to check if it's not inventoryOpen, then cast
for i in range(len(lines)):
    if "const handleSlotClick = (type: 'hotbar'" in lines[i]:
        insert_code = """
    if (!inventoryOpen) {
        let arr = [];
        if (type === 'hotbar') arr = hotbar;
        if (type === 'leftActionBar') arr = leftActionBar;
        if (type === 'rightActionBar') arr = rightActionBar;
        const slot = arr[index];
        if (slot && typeof slot === 'object' && slot.isAbility) {
             window.dispatchEvent(new CustomEvent('cast_ability', { detail: { abilityId: slot.abilityId } }));
        } else if (type === 'hotbar') {
             setSelectedSlotIndex(index);
        }
        return;
    }
        """
        lines.insert(i+1, insert_code)
        break
        
for i in range(len(lines)):
    if "onClick={() => { if (inventoryOpen) handleSlotClick('leftActionBar', index); }}" in lines[i]:
        lines[i] = lines[i].replace("if (inventoryOpen) ", "")
    if "onClick={() => { if (inventoryOpen) handleSlotClick('rightActionBar', index); }}" in lines[i]:
        lines[i] = lines[i].replace("if (inventoryOpen) ", "")
    if "onClick={() => {" in lines[i] and "if (inventoryOpen) handleSlotClick('hotbar', index);" in lines[i+1]:
        lines[i+1] = lines[i+1].replace("if (inventoryOpen) ", "")
        lines[i+2] = ""

open('src/App.tsx', 'w').write('\n'.join(lines))
