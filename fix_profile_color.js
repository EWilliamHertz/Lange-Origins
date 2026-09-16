import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
                   <button
                     key={p.id}
                     onClick={() => {
                        setActiveProfileId(p.id);
                        setNickname(p.name || 'Player');
                        setCharacterSkin(p.skin || 'orange');
                        if (p.hotbar) setHotbar(JSON.parse(p.hotbar));
                        if (p.backpack) setBackpack(JSON.parse(p.backpack));
                        if (p.health !== undefined) setHealth(p.health);
                        if (p.quests) setQuests(JSON.parse(p.quests));
                     }}
                     className={\`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 \${activeProfileId === p.id ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#0A0A0B] border-white/5 text-neutral-400 hover:text-white'}\`}
                   >
                     <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: availableSkins.find(s => s.id === p.skin)?.color || '#FF9800' }}></div>
                     {p.name || p.id}
                   </button>
`;

code = code.replace(/<button\n\s*key=\{p\.id\}\n\s*onClick=\{[\s\S]*?className=\{[\s\S]*?\n\s*>\n\s*\{p\.name \|\| p\.id\}\n\s*<\/button>/, replacement);
fs.writeFileSync('src/App.tsx', code);
