const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const healthBarHtml = `        {/* Health Bar */}
        <div className="absolute top-4 right-4 flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => {
             const val = i * 2;
             if (health >= val + 2) {
                return <Heart key={i} className="w-6 h-6 fill-red-500 text-red-500 stroke-red-500 stroke-2" />;
             } else if (health === val + 1) {
                return (
                  <div key={i} className="relative w-6 h-6">
                    <Heart className="absolute w-6 h-6 fill-transparent text-neutral-500 stroke-neutral-500 stroke-2" />
                    <div className="absolute w-1/2 h-full overflow-hidden">
                       <Heart className="w-6 h-6 fill-red-500 text-red-500 stroke-red-500 stroke-2" />
                    </div>
                  </div>
                );
             } else {
                return <Heart key={i} className="w-6 h-6 fill-transparent text-neutral-500 stroke-neutral-500 stroke-2" />;
             }
          })}
        </div>

        {/* Mana Bar */}
        {quests.find(q => q.id === 'q5')?.completed && (
          <div className="absolute top-12 right-4 flex gap-2 items-center bg-black/40 px-3 py-1.5 rounded-full border border-blue-500/30">
             <span className="text-[10px] uppercase font-black text-blue-400 tracking-wider">Mana</span>
             <div className="w-32 h-2.5 bg-neutral-800/80 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300" style={{ width: \`\${mana}%\` }}></div>
             </div>
          </div>
        )}`;

code = code.replace(/        \{\/\* Health Bar \*\/\}[\s\S]*?        <\/div>/, healthBarHtml);

fs.writeFileSync('src/App.tsx', code);
console.log('Mana bar patched.');
