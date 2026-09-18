import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

# I will find the keydown handler in App.tsx
keydown_handler = """  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotbar shortcut numbers 1-9
      if (e.key >= '1' && e.key <= '9' && appState === 'playing' && (!inventoryOpen || hoveredSlotRef.current?.type === 'ability')) {
        if (hoveredSlotRef.current?.type === 'ability') {
            const abilityId = hoveredSlotRef.current.index as unknown as string;
            setKeybinds(prev => {
                const newBinds = { ...prev };
                for (const k in newBinds) { if (newBinds[k] === abilityId) delete newBinds[k]; }
                newBinds[e.key] = abilityId;
                return newBinds;
            });
            return;
        }
        if (!inventoryOpen && document.activeElement?.tagName !== 'INPUT') {
          const index = parseInt(e.key) - 1;
          setSelectedSlotIndex(index);
        }
      } else if (appState === 'playing' && inventoryOpen && hoveredSlotRef.current?.type === 'ability' && e.key.match(/^[a-z0-9]$/i)) {
          const abilityId = hoveredSlotRef.current.index as unknown as string;
          const k = e.key.toLowerCase();
          setKeybinds(prev => {
              const newBinds = { ...prev };
              // Remove old binding for this ability
              for (const key in newBinds) { if (newBinds[key] === abilityId) delete newBinds[key]; }
              newBinds[k] = abilityId;
              return newBinds;
          });
      }
"""

old_keydown = """  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotbar shortcut numbers 1-9
      if (e.key >= '1' && e.key <= '9' && appState === 'playing' && !inventoryOpen) {
        if (document.activeElement?.tagName !== 'INPUT') {
          const index = parseInt(e.key) - 1;
          setSelectedSlotIndex(index);
        }
      }"""

content = content.replace(old_keydown, keydown_handler)

with open('src/App.tsx', 'w') as f:
    f.write(content)
