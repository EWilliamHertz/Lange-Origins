lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "{/* Chest Modal Overlay */}" in lines[i]:
        insert = """
        {/* Ready Check Modal */}
        {readyCheck && (
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
               <div className="bg-[#1A1A1E] border border-indigo-500/30 p-8 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center">
                   <Activity size={48} className="text-indigo-500 mb-4 animate-pulse" />
                   <h2 className="text-2xl font-black text-white tracking-tight mb-2 text-center">Dungeon Ready!</h2>
                   <p className="text-neutral-400 text-center mb-8 text-sm">Your party is ready for {readyCheck.instanceId}.</p>
                   <div className="flex gap-4 w-full">
                       <button onClick={() => { if (socketRef.current) socketRef.current.emit('decline_ready_check'); setReadyCheck(null); }} className="flex-1 bg-red-600/20 hover:bg-red-500 hover:text-white text-red-500 font-bold py-3 rounded-xl transition-all">Decline</button>
                       <button onClick={() => { if (socketRef.current) socketRef.current.emit('accept_ready_check'); }} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all">Accept</button>
                   </div>
               </div>
           </div>
        )}

        {/* Instances Modal */}
        {instancesOpen && (
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40" onClick={() => setInstancesOpen(false)}>
               <div className="bg-[#0A0A0B] border border-neutral-800 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col" style={{ maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
                   <div className="bg-[#1A1A1E] p-4 flex justify-between items-center border-b border-neutral-800">
                       <h2 className="text-white font-bold flex items-center gap-2"><Globe size={18} className="text-indigo-500"/> Instance Finder</h2>
                       <button onClick={() => setInstancesOpen(false)} className="text-neutral-400 hover:text-white p-2">
                           <X size={20} />
                       </button>
                   </div>
                   <div className="p-6 overflow-y-auto">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="bg-[#151518] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
                               <div>
                                   <h3 className="text-xl font-black text-white mb-2">Linear Dungeon</h3>
                                   <p className="text-neutral-400 text-sm mb-4">A straightforward dark tunnel filled with dangerous mobs and a challenging boss encounter at the very end.</p>
                                   <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-6">
                                       <Activity size={14} className="text-red-500" /> Recommended: Party of 2+
                                   </div>
                               </div>
                               <button onClick={() => {
                                   if (socketRef.current) socketRef.current.emit('queue_instance', { instanceId: 'dungeon' });
                               }} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                                   Queue for Dungeon
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
        )}
"""
        lines.insert(i, insert)
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
