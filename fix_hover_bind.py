lines = open('src/App.tsx').read().split('\n')
for i in range(760, 780):
    if "const num = parseInt(e.key);" in lines[i]:
        insert_code = """
        const pressedKey = e.key.toLowerCase();
        const boundAbility = keybinds[pressedKey];
        if (boundAbility && hoveredSlotRef.current && ['hotbar', 'leftActionBar', 'rightActionBar'].includes(hoveredSlotRef.current.type)) {
            const hRef = hoveredSlotRef.current;
            const targetArr = hRef.type === 'hotbar' ? [...hotbar] : hRef.type === 'leftActionBar' ? [...leftActionBar] : [...rightActionBar];
            targetArr[hRef.index] = { isAbility: true, abilityId: boundAbility };
            if (hRef.type === 'hotbar') setHotbar(targetArr);
            if (hRef.type === 'leftActionBar') setLeftActionBar(targetArr);
            if (hRef.type === 'rightActionBar') setRightActionBar(targetArr);
            return; // We placed the ability, consume event
        }
        """
        lines.insert(i, insert_code)
        break

open('src/App.tsx', 'w').write('\n'.join(lines))
