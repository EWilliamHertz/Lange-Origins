lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "    window.addEventListener('keydown', handleKeyDown);" in lines[i]:
        insert_code = """
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
        """
        lines.insert(i-1, insert_code)
        break

open('src/App.tsx', 'w').write('\n'.join(lines))
