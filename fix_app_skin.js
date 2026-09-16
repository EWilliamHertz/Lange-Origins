import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const skinState = `
  const [characterSkin, setCharacterSkin] = useState<string>('orange');
  const availableSkins = [
    { id: 'orange', color: '#FF9800', name: 'Orange' },
    { id: 'blue', color: '#2196F3', name: 'Blue' },
    { id: 'green', color: '#4CAF50', name: 'Green' },
    { id: 'red', color: '#F44336', name: 'Red' },
    { id: 'purple', color: '#9C27B0', name: 'Purple' },
    { id: 'pink', color: '#E91E63', name: 'Pink' },
    { id: 'gray', color: '#9E9E9E', name: 'Gray' }
  ];
`;
code = code.replace(/const \[nickname, setNickname\] = useState<string>\(\(\) => `Player\$\{Math\.floor\(Math\.random\(\) \* 10000\)\}`\);/, "const [nickname, setNickname] = useState<string>(() => `Player${Math.floor(Math.random() * 10000)}`);\n" + skinState);

// Pass characterSkin to GameCanvas
code = code.replace(/<GameCanvas\n\s*currentAmmoCount=\{currentAmmoCount\}\n\s*nickname=\{nickname\}/, "<GameCanvas\n          currentAmmoCount={currentAmmoCount}\n          nickname={nickname}\n          characterSkin={characterSkin}");

// Add character selector and name input to server browser
// Currently it's rendering a list of servers. We'll add the profile settings to the top or side.
const profileUI = `
          {/* Profile Settings */}
          <div className="bg-[#141417] rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden mb-6">
             <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                <User size={120} className="text-blue-500" />
             </div>
             <h2 className="text-2xl font-black text-white mb-6 relative z-10 font-sans tracking-tight">Your Profile</h2>
             
             <div className="flex flex-col md:flex-row gap-6 relative z-10">
                <div className="flex-1">
                   <label className="block text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wider">Display Name</label>
                   <input 
                      type="text" 
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-[#0A0A0B] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/5 font-medium transition-all"
                      placeholder="Enter a nickname..."
                      maxLength={16}
                   />
                </div>
                <div className="flex-1">
                   <label className="block text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wider">Character Skin</label>
                   <div className="flex flex-wrap gap-2">
                     {availableSkins.map(skin => (
                        <button 
                          key={skin.id}
                          onClick={() => setCharacterSkin(skin.id)}
                          className={\`w-10 h-10 rounded-full border-2 transition-all \${characterSkin === skin.id ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-105'}\`}
                          style={{ backgroundColor: skin.color }}
                          title={skin.name}
                        />
                     ))}
                   </div>
                </div>
             </div>
          </div>
`;

code = code.replace(/{publicServers\.length === 0 \? \(/, profileUI + "\n            {publicServers.length === 0 ? (");

fs.writeFileSync('src/App.tsx', code);
