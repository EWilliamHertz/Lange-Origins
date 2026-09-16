import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// First, remove the accidentally injected code near line 85.
code = code.replace(/const countAmmo = \([\s\S]*?countAmmo\(304\) : 1;/g, "");

// Now find the REAL return statement for the component.
// The main App component ends around line 952.
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

code = code.replace(/return \(\n\s*<div className="w-full h-screen/, ammoCountLogic + "\n  return (\n    <div className=\"w-full h-screen");

fs.writeFileSync('src/App.tsx', code);
