import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<\/button>\s*<\/div>\s*<div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">/g, `</button>
          </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">`);

fs.writeFileSync('src/App.tsx', code);
