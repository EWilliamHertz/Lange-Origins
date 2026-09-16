import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const \[appState, setAppState\] = useState<'landing' \| 'serverBrowser' \| 'playing'>\('landing'\);/, "const [appState, setAppState] = useState<'landing' | 'serverBrowser' | 'playing'>('landing');\n  const [interactPlayerId, setInteractPlayerId] = useState<string | null>(null);\n  const [interactPlayerName, setInteractPlayerName] = useState<string | null>(null);");

code = code.replace(/onBlockPlaced=\{[\s\S]*?\}/, `onBlockPlaced={(blockType) => {
            Sounds.placeBlock();
          }}
          onPlayerInteract={(playerId, playerName) => {
            setInteractPlayerId(playerId);
            setInteractPlayerName(playerName);
          }}`);

const modal = `
      {/* Player Interaction Modal */}
      {interactPlayerId && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Interact with {interactPlayerName}</h3>
            <p className="text-sm text-neutral-400 mb-6">What would you like to do?</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  alert("Trade request sent to " + interactPlayerName + "! (Trading system foundation ready)");
                  setInteractPlayerId(null);
                }}
                className="w-full bg-amber-600/20 hover:bg-amber-600/40 text-amber-500 py-3 rounded-xl font-bold border border-amber-500/30 transition-colors"
              >
                Request Trade
              </button>
              <button 
                onClick={() => {
                  alert("Invited " + interactPlayerName + " to your gang! (Gang system foundation ready)");
                  setInteractPlayerId(null);
                }}
                className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 py-3 rounded-xl font-bold border border-blue-500/30 transition-colors"
              >
                Invite to Gang
              </button>
              <button 
                onClick={() => setInteractPlayerId(null)}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-bold transition-colors mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/\{furnaceOpen && \(/, modal + "\n      {furnaceOpen && (");

fs.writeFileSync('src/App.tsx', code);
