const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const adminToolsRegex = /              <div className="bg-red-900\/20 rounded-2xl p-6 border border-red-900\/50 mt-6">[\s\S]*?<\/div>\n            \)\}/;

const modalCode = `              <button onClick={() => setShowAdminPanel(true)} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 py-3 rounded-2xl text-sm font-bold border border-red-500/30 transition-colors mt-6 w-full flex justify-center items-center gap-2">
                <Shield size={18} /> Open Admin Panel
              </button>
            )}

            {isAdmin && showAdminPanel && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                 <div className="bg-[#141417] p-8 rounded-[2.5rem] border border-red-900/50 shadow-2xl max-w-md w-full relative">
                    <button onClick={() => setShowAdminPanel(false)} className="absolute top-6 right-6 text-neutral-500 hover:text-white">
                       <X size={24} />
                    </button>
                    <h2 className="text-2xl font-black text-red-500 mb-6 flex items-center gap-2">
                      <Shield size={28} /> Admin Dashboard
                    </h2>
                    <div className="flex flex-col gap-4">
                      <button onClick={() => handleAdminClick('Wipe World Data')} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 py-3 rounded-xl text-sm font-bold border border-red-500/30 transition-colors">Wipe Targeted World</button>
                      <button onClick={() => handleAdminClick('Manage Players')} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 py-3 rounded-xl text-sm font-bold border border-red-500/30 transition-colors">Manage Players</button>
                    </div>
                 </div>
              </div>
            )}`;

code = code.replace(adminToolsRegex, modalCode);
fs.writeFileSync('src/App.tsx', code);
console.log('Admin Modal Updated');
