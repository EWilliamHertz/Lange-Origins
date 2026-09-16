import fs from 'fs';
let code = fs.readFileSync('src/lib/icons.tsx', 'utf8');

code = code.replace(/import \{[\s\S]*?\} from '\.\/constants';/, "import { BlockType } from './constants';");

code = code.replace(/import \{ Settings2, ArrowRightCircle, Rocket, Crosshair, Cpu,[\s\S]*?\} from 'lucide-react';/, 
`import { Settings2, ArrowRightCircle, Rocket, Crosshair, Cpu, Bomb, LocateFixed, CircleDot,
  Store, Pickaxe, Sword, Box, Flame, Sprout, Droplets, Diamond, Gem, Hexagon,
  TreePine, Trees, PocketKnife, Wrench, Activity, DoorClosed, Construction,
  Layers, SquareDashed, LayoutGrid, Hand, Shield } from 'lucide-react';`);

fs.writeFileSync('src/lib/icons.tsx', code);
