const fs = require('fs');
let icons = fs.readFileSync('src/lib/icons.tsx', 'utf8');

icons = icons.replace(
  "case BlockType.Cactus: return <TreePine className={cn(\"text-green-600\", className)} />;",
  "case BlockType.Cactus: return <TreePine className={cn(\"text-green-600\", className)} />;\n    case BlockType.TreeSeed: return <Sprout className={cn(\"text-emerald-400\", className)} />;"
);

// Add import Sprout if missing
if (!icons.includes("Sprout")) {
    icons = icons.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { Sprout, $1 } from 'lucide-react';");
}

fs.writeFileSync('src/lib/icons.tsx', icons);
console.log('Icons patched.');
