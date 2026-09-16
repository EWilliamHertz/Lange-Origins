import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<div className="flex-1 relative">\s*const countAmmo = [\s\S]*?\? countAmmo\(304\) : 1;/, `<div className="flex-1 relative">`);

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

code = code.replace(/return \(/, ammoCountLogic + "\n  return (");

fs.writeFileSync('src/App.tsx', code);
