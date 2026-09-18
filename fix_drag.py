lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "const handleDragStart = (e: React.DragEvent, type: string, index: number) => {" in lines[i]:
        lines.insert(i+1, "    e.dataTransfer.setData('text/plain', type + ',' + index);")
    if "onDragStart={(e) => { setDraggedItemInfo({ type: 'ability', index: ability.id as any }); }}" in lines[i]:
        lines[i] = "                                      onDragStart={(e) => { setDraggedItemInfo({ type: 'ability', index: ability.id as any }); e.dataTransfer.setData('text/plain', 'ability,' + ability.id); }}"

open('src/App.tsx', 'w').write('\n'.join(lines))
