const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "if (blockType === BlockType.CarrotSeed) {",
  "if (blockType === BlockType.TreeSeed || blockType === BlockType.CarrotSeed) {\n              // Consume seed\n              const seedType = blockType;\n              const consumeSeed = (inv) => {\n                 for (let i = 0; i < inv.length; i++) {\n                   if (inv[i] && inv[i].type === seedType) {\n                     const newCount = inv[i].count - 1;\n                     inv[i] = newCount > 0 ? { ...inv[i], count: newCount } : null;\n                     return true;\n                   }\n                 }\n                 return false;\n              };\n              let consumed = false;\n              setHotbar(prev => {\n                const next = [...prev];\n                if (consumeSeed(next)) consumed = true;\n                return next;\n              });\n              if (!consumed) {\n                setBackpack(prev => {\n                  const next = [...prev];\n                  consumeSeed(next);\n                  return next;\n                });\n              }\n            } else if (false) {" // to ignore the old carrotseed block
);
fs.writeFileSync('src/App.tsx', code);
console.log('Consume TreeSeed patched.');
