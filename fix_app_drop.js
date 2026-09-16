import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const dropKey = `
      if (e.key.toLowerCase() === 'q' && !inventoryOpen && !furnaceOpen && !isChatOpen && appState === 'playing') {
        setHotbar(prev => {
          const next = [...prev];
          const slot = next[selectedSlotIndex];
          if (slot) {
             // Drop one item
             if (socketRef.current) {
                // To know facing direction, we can't easily access physics state here. 
                // Wait, we don't have player's facing direction in App.tsx easily.
                // It's in gameState.current.player.facingRight in GameCanvas.
                // Alternatively, we dispatch a custom event.
                window.dispatchEvent(new CustomEvent('toss_item', { detail: { type: slot.type, count: 1 } }));
             }
             if (slot.count > 1) {
                next[selectedSlotIndex] = { ...slot, count: slot.count - 1 };
             } else {
                next[selectedSlotIndex] = null;
             }
          }
          return next;
        });
      }
`;
code = code.replace(/if \(!inventoryOpen && !furnaceOpen && !isChatOpen && appState === 'playing'\) \{/, "if (!inventoryOpen && !furnaceOpen && !isChatOpen && appState === 'playing') {\n" + dropKey);
fs.writeFileSync('src/App.tsx', code);
