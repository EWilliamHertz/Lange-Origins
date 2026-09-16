const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
                  {/* Hotbars (in Modal) */}
                  <div className="flex gap-4">
                    <div>
                      <h3 className="text-white font-bold mb-3">Hotbar</h3>
                      <div className="grid grid-cols-9 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700">
                        {hotbar.map((slot, i) => (
                          <button
                            key={i}
                            onClick={() => handleSlotClick('hotbar', i)}
                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('hotbar', i, true); }}
                            className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors relative"
                          >
                            {renderBlockIcon(slot)}
                            <span className="absolute top-1 left-1.5 text-[10px] font-bold text-white/80 drop-shadow-md">
                              {i + 1}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-white font-bold mb-3">Left Bar</h3>
                      <div className="grid grid-cols-5 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700">
                        {leftActionBar.map((slot, i) => (
                          <button
                            key={'lm'+i}
                            onClick={() => handleSlotClick('leftActionBar', i)}
                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('leftActionBar', i, true); }}
                            className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors relative"
                          >
                            {renderBlockIcon(slot)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-white font-bold mb-3">Right Bar</h3>
                      <div className="grid grid-cols-5 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700">
                        {rightActionBar.map((slot, i) => (
                          <button
                            key={'rm'+i}
                            onClick={() => handleSlotClick('rightActionBar', i)}
                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('rightActionBar', i, true); }}
                            className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors relative"
                          >
                            {renderBlockIcon(slot)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
`;

code = code.replace(
  "{/* Hotbar Grid (in Modal) */}\n                  <div>\n                    <h3 className=\"text-white font-bold mb-3\">Hotbar</h3>\n                    <div className=\"grid grid-cols-9 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700\">\n                      {hotbar.map((slot, i) => (\n                        <button\n                          key={i}\n                          onClick={() => handleSlotClick('hotbar', i)}\n                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('hotbar', i, true); }}\n                          className=\"w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors relative\"\n                        >\n                          {renderBlockIcon(slot)}\n                          <span className=\"absolute top-1 left-1.5 text-[10px] font-bold text-white/80 drop-shadow-md\">\n                            {i + 1}\n                          </span>\n                        </button>\n                      ))}\n                    </div>\n                  </div>",
  replacement.trim()
);

fs.writeFileSync('src/App.tsx', code);
console.log('Modal hotbars patched.');
