import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The duplicate tryMerge code is between lines 379 and 402 approximately.
// Let's just do string replacement from `      if (!source) return { remainingTarget: null, remainingSource: target };`
// to the next `    };\n`
const duplicateStr = `      if (!source) return { remainingTarget: null, remainingSource: target };
      if (!target) return { remainingTarget: source, remainingSource: null };
      
      const isEquipable = target.type >= 100;
      if (target.type === source.type && !isEquipable) {
        const spaceLeft = 64 - target.count;
        if (spaceLeft > 0) {
          const amountToMove = Math.min(spaceLeft, source.count);
          const newTarget = { ...target, count: target.count + amountToMove };
          const newSourceCount = source.count - amountToMove;
          return {
            remainingTarget: newTarget,
            remainingSource: newSourceCount > 0 ? { ...source, count: newSourceCount } : null
          };
        }
      }
      
      // Swap if unable to merge
      return { remainingTarget: source, remainingSource: target };
    };`;

code = code.replace(duplicateStr, '');

fs.writeFileSync('src/App.tsx', code);
