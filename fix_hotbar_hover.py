lines = open('src/App.tsx').read().split('\n')
for i in range(2500, 2520):
    if "onContextMenu={(e) => { e.preventDefault(); handleSlotClick('hotbar', i, true); }}" in lines[i]:
        lines.insert(i+1, "                            onMouseEnter={() => { if(hoveredSlotRef) hoveredSlotRef.current = { type: 'hotbar', index: i }; }}")
        lines.insert(i+2, "                            onMouseLeave={() => { if(hoveredSlotRef) hoveredSlotRef.current = null; }}")
        lines.insert(i+3, "                            draggable")
        lines.insert(i+4, "                            onDragStart={(e) => handleDragStart(e, 'hotbar', i)}")
        lines.insert(i+5, "                            onDragOver={handleDragOver}")
        lines.insert(i+6, "                            onDrop={(e) => handleDrop(e, 'hotbar', i)}")
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
