import fs from 'fs';
let code = fs.readFileSync('src/lib/icons.tsx', 'utf8');

code = code.replace(/import \{ Settings2, ArrowRightCircle, Rocket, Crosshair, Cpu, BlockType \} from '\.\/constants';/, "import { BlockType } from './constants';");
code = code.replace(/import \{\s*Store,/, "import { Settings2, ArrowRightCircle, Rocket, Crosshair, Cpu,\n  Store,");

fs.writeFileSync('src/lib/icons.tsx', code);
