const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add hoveredSlotRef
const stateHooksTarget = `  const socketRef = useRef<Socket | null>(null);`;
const stateHooksReplacement = `  const socketRef = useRef<Socket | null>(null);
  const hoveredSlotRef = useRef<{type: string, index: number} | null>(null);`;
code = code.replace(stateHooksTarget, stateHooksReplacement);

// Add to handleKeyDown
const keydownTarget = `      if (!inventoryOpen && !furnaceOpen && !isChatOpen) {
        // Hotbar selection
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          setSelectedSlotIndex(num - 1);
        }
      }`;

const keydownReplacement = `      if (!inventoryOpen && !furnaceOpen && !isChatOpen) {
        // Hotbar selection
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          setSelectedSlotIndex(num - 1);
        }
      } else if (inventoryOpen && !isChatOpen && hoveredSlotRef.current) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
           const hotbarIdx = num - 1;
           const hRef = hoveredSlotRef.current;
           // Hacky but works: dispatch a custom event to trigger the swap
           window.dispatchEvent(new CustomEvent('swap_hotbar', { detail: { hotbarIdx, type: hRef.type, index: hRef.index } }));
        }
      }`;
code = code.replace(keydownTarget, keydownReplacement);

fs.writeFileSync('src/App.tsx', code);
console.log('Added hotkey swap logic skeleton');
