lines = open('src/App.tsx').read().split('\n')
for i in range(2200, 2330):
    if "className=\"absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-xl border border-white/10 flex flex-col gap-1 z-10\"" in lines[i]:
        lines[i] = lines[i].replace("z-10", "z-10 ${inventoryOpen ? 'z-[60]' : ''}")
        lines[i] = lines[i].replace("className=\"", "className={`")
        lines[i] = lines[i].replace("z-10\"", "z-10`}")
    if "className=\"absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-xl border border-white/10 flex flex-col gap-1 z-10\"" in lines[i]:
        lines[i] = lines[i].replace("z-10", "z-10 ${inventoryOpen ? 'z-[60]' : ''}")
        lines[i] = lines[i].replace("className=\"", "className={`")
        lines[i] = lines[i].replace("z-10\"", "z-10`}")
    if "className=\"absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl\"" in lines[i]:
        lines[i] = lines[i].replace("shadow-2xl", "shadow-2xl ${inventoryOpen ? 'z-[60]' : 'z-20'}")
        lines[i] = lines[i].replace("className=\"", "className={`")
        lines[i] = lines[i].replace("shadow-2xl\"", "shadow-2xl`}")
        
    if "onClick={() => { if (inventoryOpen) handleSlotClick('leftActionBar', index); }}" in lines[i]:
        lines.insert(i+1, "               onDragOver={handleDragOver}")
        lines.insert(i+2, "               onDrop={(e) => handleDrop(e, 'leftActionBar', index)}")
    if "onClick={() => { if (inventoryOpen) handleSlotClick('rightActionBar', index); }}" in lines[i]:
        lines.insert(i+1, "               onDragOver={handleDragOver}")
        lines.insert(i+2, "               onDrop={(e) => handleDrop(e, 'rightActionBar', index)}")

open('src/App.tsx', 'w').write('\n'.join(lines))
