const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<\/div>\s*<\/div>\s*<\/div>\s*<div className="flex justify-between items-center bg-neutral-900\/80 p-4 rounded-xl border border-neutral-700 mt-6">/;
const replacement = `                       </div>
                       
                       {/* Woodcutting */}
                       <div className="bg-neutral-800/60 p-4 rounded-xl border border-neutral-700 flex flex-col gap-3">
                           <div className="flex justify-between items-start">
                               <div>
                                   <h4 className="text-lg font-bold text-green-400 drop-shadow">Woodcutting</h4>
                                   <p className="text-neutral-400 text-sm">Passively increases chopping speed by 10% per level.</p>
                                   <div className="w-full bg-neutral-900 rounded-full h-1.5 mt-2 overflow-hidden border border-neutral-700">
                                       <div className="bg-green-500 h-full" style={{ width: \`\${Math.min(100, ((skills.woodcuttingXp || 0) / ((skills.woodcutting || 1) * 50)) * 100)}%\` }} />
                                   </div>
                               </div>
                               <span className="bg-neutral-900 px-3 py-1 rounded text-white font-bold border border-neutral-700">Lv {skills.woodcutting || 1}</span>
                           </div>
                       </div>
                       
                       {/* Mining */}
                       <div className="bg-neutral-800/60 p-4 rounded-xl border border-neutral-700 flex flex-col gap-3">
                           <div className="flex justify-between items-start">
                               <div>
                                   <h4 className="text-lg font-bold text-gray-400 drop-shadow">Mining</h4>
                                   <p className="text-neutral-400 text-sm">Passively increases mining speed by 10% per level.</p>
                                   <div className="w-full bg-neutral-900 rounded-full h-1.5 mt-2 overflow-hidden border border-neutral-700">
                                       <div className="bg-gray-500 h-full" style={{ width: \`\${Math.min(100, ((skills.miningXp || 0) / ((skills.mining || 1) * 50)) * 100)}%\` }} />
                                   </div>
                               </div>
                               <span className="bg-neutral-900 px-3 py-1 rounded text-white font-bold border border-neutral-700">Lv {skills.mining || 1}</span>
                           </div>
                       </div>
                   </div>
                </div>
                <div className="flex justify-between items-center bg-neutral-900/80 p-4 rounded-xl border border-neutral-700 mt-6">`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
