const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const stateHooksTarget = `  const socketRef = useRef<Socket | null>(null);`;
const stateHooksReplacement = `  const socketRef = useRef<Socket | null>(null);
  const hoveredSlotRef = useRef<{type: string, index: number} | null>(null);`;
code = code.replace(stateHooksTarget, stateHooksReplacement);

const targetKeyDown = `      if (!inventoryOpen && !furnaceOpen && !questLogOpen && !showNPCMessage) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          setSelectedSlotIndex(num - 1);
        }
      }`;

const replaceKeyDown = `      if (!inventoryOpen && !furnaceOpen && !questLogOpen && !showNPCMessage) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          setSelectedSlotIndex(num - 1);
        }
      } else if (inventoryOpen && hoveredSlotRef.current) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
           const hotbarIdx = num - 1;
           const hRef = hoveredSlotRef.current;
           // Dispatch event for hotbar swap
           window.dispatchEvent(new CustomEvent('swap_hotbar', { detail: { hotbarIdx, type: hRef.type, index: hRef.index } }));
        }
      }`;

code = code.replace(targetKeyDown, replaceKeyDown);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed hotkey logic');
