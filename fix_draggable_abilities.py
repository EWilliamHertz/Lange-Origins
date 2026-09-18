lines = open('src/App.tsx').read().split('\n')
for i in range(2670, 2700):
    if "key={ability.id}" in lines[i]:
        lines.insert(i+1, "                                      draggable={unlocked}")
        lines.insert(i+2, "                                      onDragStart={(e) => { e.dataTransfer.setData('sourceType', 'ability'); e.dataTransfer.setData('abilityId', ability.id); }}")
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
