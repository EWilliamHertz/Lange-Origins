import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

// Notice GameCanvas useEffect dependencies: [dimensions, selectedBlock]
// Wait, changing selectedBlock completely recreates the event listeners!
// Wait! If you press 1-9, App.tsx handles that and changes selectedSlotIndex -> selectedBlock!
// Then GameCanvas re-runs useEffect!

const oldDep = `  }, [dimensions, selectedBlock]);`;
const newDep = `  }, [dimensions]);`;

// Since we removed selectedBlock from dep array, we need to make sure GameCanvas still uses the LATEST selectedBlock!
// Luckily GameCanvas reads from propsRef!

code = code.replace(oldDep, newDep);
fs.writeFileSync('src/components/GameCanvas.tsx', code);
