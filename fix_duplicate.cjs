const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace("  const hoveredSlotRef = useRef<{type: string, index: number} | null>(null);\\n  const hoveredSlotRef = useRef<{type: string, index: number} | null>(null);", "  const hoveredSlotRef = useRef<{type: string, index: number} | null>(null);");
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed duplicate declaration');
