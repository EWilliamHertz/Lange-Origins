import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
                            <button onClick={() => handleUpvote(bp.id)} className="flex items-center gap-2 text-xs text-neutral-500 hover:text-red-400 bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-full border border-white/5 hover:border-red-500/30 transition-all active:scale-95 cursor-pointer">
                               <Heart size={14} className="text-red-500/70" /> {bp.likes || 0}
                            </button>
`;

code = code.replace(/<div className="flex items-center gap-2 text-xs text-neutral-500 bg-black\/40 px-2 py-1 rounded-full border border-white\/5">\s*<Heart size=\{12\} className="text-red-500\/70" \/> \{bp.likes \|\| 0\}\s*<\/div>/, replacement);
fs.writeFileSync('src/App.tsx', code);
