lines = open('src/App.tsx').read().split('\n')
for i in range(2200, 2370):
    if "onDrop={(e) => handleDrop(e, 'leftActionBar', index)}" in lines[i]:
        lines.insert(i+1, "               onMouseEnter={() => { if(hoveredSlotRef) hoveredSlotRef.current = { type: 'leftActionBar', index }; }}")
        lines.insert(i+2, "               onMouseLeave={() => { if(hoveredSlotRef) hoveredSlotRef.current = null; }}")
    if "onDrop={(e) => handleDrop(e, 'rightActionBar', index)}" in lines[i]:
        lines.insert(i+1, "               onMouseEnter={() => { if(hoveredSlotRef) hoveredSlotRef.current = { type: 'rightActionBar', index }; }}")
        lines.insert(i+2, "               onMouseLeave={() => { if(hoveredSlotRef) hoveredSlotRef.current = null; }}")
    if "onDrop={(e) => handleDrop(e, 'hotbar', index)}" in lines[i]:
        lines.insert(i+1, "                onMouseEnter={() => { if(hoveredSlotRef) hoveredSlotRef.current = { type: 'hotbar', index }; }}")
        lines.insert(i+2, "                onMouseLeave={() => { if(hoveredSlotRef) hoveredSlotRef.current = null; }}")

open('src/App.tsx', 'w').write('\n'.join(lines))
