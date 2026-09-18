const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add state variable
code = code.replace(/const \[showNPCMessage, setShowNPCMessage\] = useState\(false\);/, 
  'const [showNPCMessage, setShowNPCMessage] = useState(false);\n  const [showDurelScroll, setShowDurelScroll] = useState(false);');

// 2. Modify the onInteract logic
code = code.replace(/if \(blockType === BlockType\.DurelNPC\) \{[\s\S]*?\}/, 
  `if (blockType === BlockType.DurelNPC) {
              setShowDurelScroll(true);
            }`);

// 3. Inject the UI (insert right before {/* Action Bars */})
const uiCode = `
        {/* Durel's Scroll of Slain Monsters */}
        {showDurelScroll && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
             <div className="bg-[#f4e4bc] border-4 border-[#8c5e34] rounded shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-md w-full p-8 relative" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\\"100%\\" height=\\"100%\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cfilter id=\\"noise\\"%3E%3CfeTurbulence type=\\"fractalNoise\\" baseFrequency=\\"0.8\\" numOctaves=\\"4\\" stitchTiles=\\"stitch\\"%3E%3C/feTurbulence%3E%3C/filter%3E%3Crect width=\\"100%\\" height=\\"100%\\" filter=\\"url(%23noise)\\" opacity=\\"0.15\\"%3E%3C/rect%3E%3C/svg%3E")' }}>
                <button onClick={() => setShowDurelScroll(false)} className="absolute top-4 right-4 text-[#8c5e34] hover:text-red-800 font-bold text-2xl leading-none">&times;</button>
                <div className="text-center mb-6 border-b-2 border-[#8c5e34] pb-4">
                   <h2 className="text-3xl font-black text-[#5c3e24]" style={{ fontFamily: 'Georgia, serif' }}>Scroll of the Slain</h2>
                   <p className="text-[#8c5e34] italic font-serif">Compiled by Durel the Watcher</p>
                </div>
                
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                   {Object.keys(kills).length === 0 ? (
                      <p className="text-center text-[#8c5e34] italic py-8">Thy blade has yet to taste blood... Go forth and hunt!</p>
                   ) : (
                      Object.entries(kills).map(([mob, count]) => (
                         <div key={mob} className="flex justify-between items-center bg-[#eaddb3] p-3 rounded border border-[#d4c391]">
                            <span className="font-bold text-[#5c3e24] uppercase tracking-wider">{mob}</span>
                            <span className="text-lg font-black text-[#8c5e34]">{count}</span>
                         </div>
                      ))
                   )}
                </div>
                
                <div className="mt-8 pt-4 border-t-2 border-[#8c5e34] text-center">
                   <p className="text-sm text-[#8c5e34] font-serif italic">"Every soul claimed writes a line upon this parchment."</p>
                </div>
             </div>
          </div>
        )}
`;

code = code.replace(/\{\/\* Action Bars \*\/\}/, uiCode + '\n        {/* Action Bars */}');

fs.writeFileSync('src/App.tsx', code);
