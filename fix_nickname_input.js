import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<div className="flex gap-4 mt-10 mb-10">
            <div className="relative flex-1">`;

const replacement = `<div className="flex flex-col gap-6 mt-10 mb-10">
            <div className="relative w-full">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1 mb-2 block">Your Nickname</label>
              <input 
                type="text" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-[#0A0A0B]/80 border border-neutral-800 text-neutral-200 rounded-2xl pl-5 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-neutral-700 transition-all shadow-inner text-lg placeholder-neutral-600"
                placeholder="Enter Nickname..."
              />
            </div>
            <div className="flex gap-4">
            <div className="relative flex-1">`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
