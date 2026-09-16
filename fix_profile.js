import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldProfile = `                  <h3 className="text-2xl font-bold text-white">{interactPlayerName}</h3>
                  <div className="flex gap-3 mt-2">
                     <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">3 Blueprints</span>
                     <span className="text-xs text-fuchsia-400 bg-fuchsia-500/10 px-2 py-1 rounded border border-fuchsia-500/20">2 Collections</span>
                  </div>`;

const newProfile = `                  <h3 className="text-2xl font-bold text-white">{interactPlayerName}</h3>
                  <div className="flex gap-3 mt-2">
                     <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Online</span>
                  </div>`;

code = code.replace(oldProfile, newProfile);
fs.writeFileSync('src/App.tsx', code);
