import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const badUI = `    const icon = getBlockIcon(type, "w-full h-full p-1 drop-shadow-md");

      <div 
        data-tooltip={title}`;
        
const goodUI = `    const icon = getBlockIcon(type, "w-full h-full p-1 drop-shadow-md");

    return (
      <div 
        data-tooltip={title}`;
        
code = code.replace(badUI, goodUI);

fs.writeFileSync('src/App.tsx', code);
