const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const [inventoryTab, setInventoryTab] = useState<'crafting' | 'guide'>('crafting');",
  "const [inventoryTab, setInventoryTab] = useState<'crafting' | 'guide' | 'skills'>('crafting');"
);

code = code.replace(
  "                  <button \n                    onClick={() => setInventoryTab('guide')}\n                    className={`text-lg font-bold px-4 py-2 rounded-t-lg transition-colors flex items-center gap-2 ${inventoryTab === 'guide' ? 'bg-blue-900/50 text-blue-400' : 'text-neutral-500 hover:text-white'}`}\n                  >\n                    <Book size={20} /> Recipe Guide\n                  </button>",
  `                  <button 
                    onClick={() => setInventoryTab('guide')}
                    className={\`text-lg font-bold px-4 py-2 rounded-t-lg transition-colors flex items-center gap-2 \${inventoryTab === 'guide' ? 'bg-blue-900/50 text-blue-400' : 'text-neutral-500 hover:text-white'}\`}
                  >
                    <Book size={20} /> Recipe Guide
                  </button>
                  <button 
                    onClick={() => setInventoryTab('skills')}
                    className={\`text-lg font-bold px-4 py-2 rounded-t-lg transition-colors flex items-center gap-2 \${inventoryTab === 'skills' ? 'bg-amber-900/50 text-amber-400' : 'text-neutral-500 hover:text-white'}\`}
                  >
                    <Star size={20} /> Skills
                  </button>`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added skills tab button');
