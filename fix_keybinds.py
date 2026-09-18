lines = open('src/App.tsx').read().split('\n')
for i in range(760, 775):
    if "} else if (inventoryOpen && hoveredSlotRef.current) {" in lines[i]:
        # we need to check if the hover is an ability, then any key can be bound!
        lines.insert(i+1, "        if (hoveredSlotRef.current.type === 'ability') {")
        lines.insert(i+2, "           const key = e.key.toLowerCase();")
        lines.insert(i+3, "           if (key !== 'escape' && key !== 'tab' && key !== 'e' && key !== 'enter') {")
        lines.insert(i+4, "               setKeybinds(prev => {")
        lines.insert(i+5, "                   const next = { ...prev };")
        lines.insert(i+6, "                   for (const k in next) if (next[k] === hoveredSlotRef.current.index) delete next[k];")
        lines.insert(i+7, "                   next[key] = hoveredSlotRef.current.index;")
        lines.insert(i+8, "                   return next;")
        lines.insert(i+9, "               });")
        lines.insert(i+10, "           }")
        lines.insert(i+11, "           return;")
        lines.insert(i+12, "        }")
        break

open('src/App.tsx', 'w').write('\n'.join(lines))
