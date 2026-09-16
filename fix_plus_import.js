import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, Plus } from 'lucide-react';");

fs.writeFileSync('src/App.tsx', code);
