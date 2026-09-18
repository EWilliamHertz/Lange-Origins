lines = open('src/App.tsx').read().split('\n')
for i in range(1142, 1150):
    if "const { type: srcType, index: srcIndex } = draggedItemInfo;" in lines[i]:
        lines.insert(i+1, "    if (srcType === 'ability') {")
        lines.insert(i+2, "        const targetArr = [...(targetType === 'backpack' ? backpack : targetType === 'hotbar' ? hotbar : targetType === 'leftActionBar' ? leftActionBar : targetType === 'rightActionBar' ? rightActionBar : targetType === 'equipment' ? equipment : [])];")
        lines.insert(i+3, "        targetArr[targetIndex] = { isAbility: true, abilityId: srcIndex as string };")
        lines.insert(i+4, "        if (targetType === 'backpack') setBackpack(targetArr);")
        lines.insert(i+5, "        if (targetType === 'hotbar') setHotbar(targetArr);")
        lines.insert(i+6, "        if (targetType === 'leftActionBar') setLeftActionBar(targetArr);")
        lines.insert(i+7, "        if (targetType === 'rightActionBar') setRightActionBar(targetArr);")
        lines.insert(i+8, "        setDraggedItemInfo(null);")
        lines.insert(i+9, "        return;")
        lines.insert(i+10, "    }")
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
