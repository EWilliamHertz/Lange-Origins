const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetUseEffect = `  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {`;

const replaceUseEffect = `  useEffect(() => {
    const handleSwapHotbar = (e: any) => {
        const { hotbarIdx, type, index } = e.detail;
        if (type === 'backpack') {
             setHotbar(prevHotbar => {
                 setBackpack(prevBackpack => {
                     const nextH = [...prevHotbar];
                     const nextB = [...prevBackpack];
                     const temp = nextH[hotbarIdx];
                     nextH[hotbarIdx] = nextB[index];
                     nextB[index] = temp;
                     return nextB;
                 });
                 return prevHotbar; // Will be overwritten by state setter in the callback, but wait. The above sets backpack. We need to set hotbar.
             });
        }
    };
    
    // Better way:
    const handleSwap = (e: any) => {
        const { hotbarIdx, type, index } = e.detail;
        if (type === 'backpack') {
            let nextH, nextB;
            setHotbar(h => { nextH = [...h]; return h; });
            setBackpack(b => { nextB = [...b]; return b; });
            const temp = nextH[hotbarIdx];
            nextH[hotbarIdx] = nextB[index];
            nextB[index] = temp;
            setHotbar(nextH);
            setBackpack(nextB);
        } else if (type === 'leftActionBar') {
            let nextH, nextL;
            setHotbar(h => { nextH = [...h]; return h; });
            setLeftActionBar(l => { nextL = [...l]; return l; });
            const temp = nextH[hotbarIdx];
            nextH[hotbarIdx] = nextL[index];
            nextL[index] = temp;
            setHotbar(nextH);
            setLeftActionBar(nextL);
        } else if (type === 'rightActionBar') {
            let nextH, nextR;
            setHotbar(h => { nextH = [...h]; return h; });
            setRightActionBar(r => { nextR = [...r]; return r; });
            const temp = nextH[hotbarIdx];
            nextH[hotbarIdx] = nextR[index];
            nextR[index] = temp;
            setHotbar(nextH);
            setRightActionBar(nextR);
        }
    };
    window.addEventListener('swap_hotbar', handleSwap);

    const handleKeyDown = (e: KeyboardEvent) => {`;

code = code.replace(targetUseEffect, replaceUseEffect);

const cleanupTarget = `return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, inventoryOpen, furnaceOpen, isChatOpen]);`;

const cleanupReplace = `return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('swap_hotbar', handleSwap); };
  }, [appState, inventoryOpen, furnaceOpen, isChatOpen]);`;

code = code.replace(cleanupTarget, cleanupReplace);
fs.writeFileSync('src/App.tsx', code);
console.log('Added hotbar swap listener');
