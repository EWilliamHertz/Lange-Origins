lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if 'className="mt-8 flex gap-3 shrink-0"' in lines[i]:
        lines[i] = """
             <div className="mt-8 flex flex-col gap-3 shrink-0">
               <button
                 onClick={() => joinServer('dungeon_' + Math.floor(Math.random() * 100000))}
                 className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95 flex items-center justify-center gap-2 text-lg w-full"
               >
                 Create Dungeon Instance
               </button>
               <div className="flex gap-3 w-full">
"""
    if "Join <ArrowRight" in lines[i]:
        lines[i+2] = "               </div>\n             </div>"
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
