import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
                <div className="flex flex-col items-center justify-center w-24">
                   <div className="w-full bg-neutral-800 rounded-full h-2.5 mb-2 border border-neutral-700">
                      <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-200" style={{ width: \`\${smeltProgress}%\` }}></div>
                   </div>
                   <ArrowRight className="text-neutral-500 w-8 h-8" />
                </div>
`;

code = code.replace(/<div className="flex flex-col items-center justify-center">\s*<button\s*onClick=\{handleSmelt\}[\s\S]*?SMELT\s*<\/button>\s*<ArrowRight className="text-neutral-500 w-8 h-8" \/>\s*<\/div>/, replacement);
fs.writeFileSync('src/App.tsx', code);
