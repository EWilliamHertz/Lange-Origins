import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const updatedInstructions = `
        {/* Instructions Modal */}
        {showInstructions && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100]">
            <div className="bg-[#141417] p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-2xl w-full text-white transform transition-all">
              <div className="text-center mb-10">
                 <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-3 tracking-tight">Welcome to AI Sandbox</h2>
                 <p className="text-neutral-400">Master your controls to survive and thrive.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                 <div className="bg-[#0A0A0B]/80 p-6 rounded-3xl border border-white/5">
                    <h3 className="text-sm uppercase tracking-widest text-neutral-500 font-bold mb-4">Movement & Combat</h3>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5">WASD</span> <span className="text-sm text-neutral-300">Move & Jump</span></li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg></span> <span className="text-sm text-neutral-300">Left Click to Mine/Attack</span></li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg></span> <span className="text-sm text-neutral-300">Right Click to Place/Interact</span></li>
                    </ul>
                 </div>
                 
                 <div className="bg-[#0A0A0B]/80 p-6 rounded-3xl border border-white/5">
                    <h3 className="text-sm uppercase tracking-widest text-neutral-500 font-bold mb-4">Inventory & UI</h3>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5">E</span> <span className="text-sm text-neutral-300">Open Inventory/Crafting</span></li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5">Q</span> <span className="text-sm text-neutral-300">Toss Item</span></li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5">1-9</span> <span className="text-sm text-neutral-300">Select Hotbar Slot</span></li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5">↵</span> <span className="text-sm text-neutral-300">Open Global Chat</span></li>
                    </ul>
                 </div>
              </div>
              
              <button 
                onClick={() => setShowInstructions(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Enter the World <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}
`;

code = code.replace(/\{\/\* Instructions Modal \*\/\}\n\s*\{showInstructions && \([\s\S]*?Start Playing\n\s*<\/button>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}/, updatedInstructions);
fs.writeFileSync('src/App.tsx', code);
