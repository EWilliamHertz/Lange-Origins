import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const ammoCountLogic = `
  const countAmmo = (type: number) => {
      let count = 0;
      hotbar.forEach(s => { if(s && s.type === type) count += s.count; });
      backpack.forEach(s => { if(s && s.type === type) count += s.count; });
      return count;
  };
  const currentAmmoCount = 
      selectedBlock === 302 ? countAmmo(303) :
      selectedBlock === 109 ? countAmmo(110) :
      selectedBlock === 304 ? countAmmo(304) : 1;
`;

// Insert it right before the final return statement, specifically where we know the main app is returning.
// Wait, the previous block failed because it was looking for `return (` but hit an early return.
// Let's find the specific GameCanvas return.

code = code.replace(/return \(\n\s*<div className="w-full h-screen bg-neutral-900 flex flex-col/, ammoCountLogic + "\n  return (\n    <div className=\"w-full h-screen bg-neutral-900 flex flex-col");

fs.writeFileSync('src/App.tsx', code);
