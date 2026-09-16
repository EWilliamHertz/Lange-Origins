import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">`;

const replacement = `            </button>
          </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
