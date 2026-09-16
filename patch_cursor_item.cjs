const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const returnFunc = `
  const returnCursorItemToInventory = (item) => {
     if (!item || item.type === 0) return;
     setBackpack(prev => {
        const next = [...prev];
        let remaining = item.count;
        for (let i = 0; i < next.length; i++) {
           if (next[i] && next[i].type === item.type && next[i].count < 64) {
              const space = 64 - next[i].count;
              const add = Math.min(remaining, space);
              next[i] = { ...next[i], count: next[i].count + add };
              remaining -= add;
              if (remaining <= 0) return next;
           }
        }
        for (let i = 0; i < next.length; i++) {
           if (!next[i]) {
              next[i] = { type: item.type, count: remaining, durability: item.durability };
              return next;
           }
        }
        return next;
     });
     setCursorItem(null);
  };
`;

code = code.replace(
  "  const [cursorItem, setCursorItem] = useState<InventorySlot>(null);",
  "  const [cursorItem, setCursorItem] = useState<InventorySlot>(null);\n" + returnFunc
);

code = code.replace(/setCursorItem\(null\); \/\/ Simple cursor clear to avoid item loss issues right now/g, "returnCursorItemToInventory(cursorItem);");

code = code.replace(/if \(furnaceOpen\) \{\n          setFurnaceOpen\(false\);\n          setCursorItem\(null\);\n          return;\n        \}/g, "if (furnaceOpen) {\n          setFurnaceOpen(false);\n          returnCursorItemToInventory(cursorItem);\n          return;\n        }");

code = code.replace(/if \(chestOpen\) \{\n          setChestOpen\(false\);\n          setActiveChestCoords\(null\);\n          setCursorItem\(null\);\n          return;\n        \}/g, "if (chestOpen) {\n          setChestOpen(false);\n          setActiveChestCoords(null);\n          returnCursorItemToInventory(cursorItem);\n          return;\n        }");

code = code.replace(/if \(inventoryOpen\) \{\n          setInventoryOpen\(false\);\n          setCursorItem\(null\);\n          return;\n        \}/g, "if (inventoryOpen) {\n          setInventoryOpen(false);\n          returnCursorItemToInventory(cursorItem);\n          return;\n        }");

code = code.replace(/setInventoryOpen\(prev => \{\n          if \(prev\) setCursorItem\(null\);/g, "setInventoryOpen(prev => {\n          if (prev) returnCursorItemToInventory(cursorItem);");

fs.writeFileSync('src/App.tsx', code);
console.log('Cursor item bug patched.');
