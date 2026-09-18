lines = open('src/App.tsx').read().split('\n')
start_idx = -1
for i in range(len(lines)):
    if 'className="mt-8 flex flex-col gap-3 shrink-0"' in lines[i]:
        start_idx = i
        break
end_idx = start_idx
while "Join <ArrowRight" not in lines[end_idx]:
    end_idx += 1
end_idx += 2 # include button and div closure

replacement = """
             <div className="mt-8 flex gap-3 shrink-0">
               <input
                 type="text"
                 value={joinInput}
                 onChange={(e) => setJoinInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && joinServer(joinInput)}
                 className="flex-1 bg-[#0A0A0B]/80 border border-neutral-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-neutral-700 transition-all shadow-inner text-lg placeholder-neutral-600"
                 placeholder="Enter server address..."
               />
               <button
                 onClick={() => joinServer(joinInput)}
                 className="bg-white hover:bg-neutral-200 text-black px-8 py-4 rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 flex items-center gap-2 text-lg"
               >
                 Join <ArrowRight size={20}/>
               </button>
             </div>
"""
del lines[start_idx:end_idx+2]
lines.insert(start_idx, replacement.strip('\n'))
open('src/App.tsx', 'w').write('\n'.join(lines))
