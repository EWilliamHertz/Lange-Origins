const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replaceCode = `
        {icon ? icon : (
          <>
            {type === BlockType.Grass && (
              <div className="w-full h-1/4 bg-[#4CAF50] pointer-events-none" />
            )}
            {type === BlockType.Chest && (
              <div className="absolute inset-1 border border-[#3E2723] rounded-[1px] pointer-events-none">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-2 bg-[#9E9E9E]" />
              </div>
            )}
            {type !== BlockType.Leaves && type !== BlockType.Glass && type !== BlockType.Lava && (
              <div className="w-full h-full border border-black/20 pointer-events-none" />
            )}
          </>
        )}
        {(typeof slot !== 'number' && slot.durability !== undefined) && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 overflow-hidden z-20">
             <div className="h-full" style={{ 
                 width: \`\${Math.max(0, slot.durability / ((type === 409 || type === 410) ? 150 : (type === 407 || type === 408) ? 40 : 50)) * 100}%\`, 
                 backgroundColor: slot.durability / 50 > 0.5 ? '#4CAF50' : slot.durability / 50 > 0.2 ? '#FFC107' : '#F44336' 
             }} />
          </div>
        )}
`;

let targetBlockEnd = `
         {icon ? icon : (
           <>
             {type === BlockType.Grass && (
               <div className="w-full h-1/4 bg-[#4CAF50] pointer-events-none" />
             )}
             {type === BlockType.Chest && (
               <div className="absolute inset-1 border border-[#3E2723] rounded-[1px] pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-2 bg-[#9E9E9E]" />
               </div>
             )}
             {type !== BlockType.Leaves && type !== BlockType.Glass && type !== BlockType.Lava && (
               <div className="w-full h-full border border-black/20 pointer-events-none" />
             )}
           </>
         )}
`;

if (code.includes(targetBlockEnd)) {
    code = code.replace(targetBlockEnd, replaceCode);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success");
} else {
    console.log("Failed to find target");
}
