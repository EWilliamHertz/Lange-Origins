lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "e.dataTransfer.setData('sourceType', 'ability'); e.dataTransfer.setData('abilityId', ability.id);" in lines[i]:
        lines[i] = "                                      onDragStart={(e) => { setDraggedItemInfo({ type: 'ability', index: ability.id as any }); }}"

open('src/App.tsx', 'w').write('\n'.join(lines))
