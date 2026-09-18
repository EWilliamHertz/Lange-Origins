lines = open('src/App.tsx').read().split('\n')

start_idx = -1
for i in range(len(lines)):
    if '<div className="mb-8">' in lines[i] and 'Recent' in lines[i+2]:
        start_idx = i
        break

end_idx = start_idx
while ") : (" not in lines[end_idx]:
    end_idx += 1

replacement = """
                   <div className="mb-8">
                     <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                       <Clock size={14} className="text-neutral-500" /> Recent
                     </h3>
                     <div className="flex flex-wrap gap-2">
                       {recentServers.length > 0 ? recentServers.map(srv => (
                         <button key={srv} onClick={() => joinServer(srv)} className="bg-[#0A0A0B]/60 hover:bg-[#1A1A1E]/80 border border-neutral-800/50 hover:border-neutral-700 px-4 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                           {srv}
                         </button>
                       )) : <p className="text-neutral-600 text-sm italic py-1">No recent servers.</p>}
                     </div>
                   </div>
                 </div>
               ) : (
"""

del lines[start_idx:end_idx+1]
lines.insert(start_idx, replacement.strip('\n'))
open('src/App.tsx', 'w').write('\n'.join(lines))
