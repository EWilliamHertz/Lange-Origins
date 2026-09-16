import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importSearch = "import { Heart, MessageSquare, ArrowRight, Hand, LogOut, User, Star, Clock, Globe, Scroll, X, Book, Shield, Plus, Layers, ShoppingBag } from 'lucide-react';";
const importReplace = "import { Heart, MessageSquare, ArrowRight, Hand, LogOut, User, Star, Clock, Globe, Scroll, X, Book, Shield, Plus, Layers, ShoppingBag, Volume2, VolumeX } from 'lucide-react';";
code = code.replace(importSearch, importReplace);

// Add audio state
const stateSearch = `  const [appState, setAppState] = useState<'landing' | 'serverBrowser' | 'playing'>('landing');`;
const stateReplace = `  const [appState, setAppState] = useState<'landing' | 'serverBrowser' | 'playing'>('landing');
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  
  useEffect(() => {
     if (isMuted) {
       Sounds.setVolume(0);
     } else {
       Sounds.setVolume(volume);
     }
  }, [volume, isMuted]);
  
  useEffect(() => {
     if (appState !== 'landing') {
        Sounds.startLofiMusic();
     } else {
        Sounds.stopLofiMusic();
     }
  }, [appState]);
`;
code = code.replace(stateSearch, stateReplace);

// Add volume controls to the UI
const uiSearch = `                <button 
                  onClick={() => { saveProgress(); setAppState('serverBrowser'); }}
                  className="bg-red-600/80 hover:bg-red-500 text-white text-sm font-bold py-1.5 px-4 rounded shadow-lg backdrop-blur transition-opacity flex items-center gap-2"
                >
                  <LogOut size={16} /> Leave World
                </button>`;

const uiReplace = `                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-neutral-700">
                    <button onClick={() => setIsMuted(!isMuted)} className="text-neutral-400 hover:text-white transition-colors">
                      {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.01" 
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                         setVolume(parseFloat(e.target.value));
                         if (parseFloat(e.target.value) > 0) setIsMuted(false);
                      }}
                      className="w-24 accent-emerald-500 h-1.5 bg-neutral-600 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <button 
                    onClick={() => { saveProgress(); setAppState('serverBrowser'); }}
                    className="bg-red-600/80 hover:bg-red-500 text-white text-sm font-bold py-1.5 px-4 rounded shadow-lg backdrop-blur transition-opacity flex items-center gap-2"
                  >
                    <LogOut size={16} /> Leave World
                  </button>
                </div>`;
code = code.replace(uiSearch, uiReplace);

fs.writeFileSync('src/App.tsx', code);
