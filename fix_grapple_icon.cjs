const fs = require('fs');
let code = fs.readFileSync('src/lib/icons.tsx', 'utf8');

code = code.replace(
  "LayoutGrid, Hand, Shield } from 'lucide-react';",
  "LayoutGrid, Hand, Shield, Anchor } from 'lucide-react';"
);

code = code.replace(
  "case BlockType.Gun:",
  "case BlockType.GrapplingHook:\n      return <Anchor className={className} style={{ color: '#455A64' }} />;\n    case BlockType.Gun:"
);

fs.writeFileSync('src/lib/icons.tsx', code);
console.log('Added grappling hook icon');
