import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('const [nickname,')) {
    code = code.replace(/const \[joinInput, setJoinInput\] = useState<string>\('public-lobby'\);/, 
        "const [joinInput, setJoinInput] = useState<string>('public-lobby');\n  const [nickname, setNickname] = useState<string>(() => `Player${Math.floor(Math.random() * 10000)}`);");
}

const inputReplacement = `<div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Your Nickname</label>
                    <input 
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-[#0A0A0B] text-white px-5 py-4 rounded-xl border border-white/10 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder-neutral-700"
                      placeholder="Enter a nickname"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Direct Connection</label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        value={joinInput}
                        onChange={(e) => setJoinInput(e.target.value)}
                        placeholder="Enter Server Name" 
                        className="flex-1 bg-[#0A0A0B] text-white px-5 py-4 rounded-xl border border-white/10 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder-neutral-700"
                      />
                      <button 
                        onClick={() => {
                          if (joinInput.trim()) {
                            setServerName(joinInput.trim());
                            setAppState('playing');
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] whitespace-nowrap"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                </div>`;

code = code.replace(/<div className="flex gap-3">[\s\S]*?<\/button>\n                    <\/div>/, inputReplacement);

// Update GameCanvas instantiation
code = code.replace(/<GameCanvas[\s\S]*?onBlockMined=/g, function(match) {
    if (!match.includes('nickname={nickname}')) {
        return match.replace(/<GameCanvas/, '<GameCanvas \n          nickname={nickname}');
    }
    return match;
});

fs.writeFileSync('src/App.tsx', code);
