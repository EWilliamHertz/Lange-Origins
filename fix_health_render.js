import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/setHealth\(100\)/g, 'setHealth(20)');
code = code.replace(/const \[health, setHealth\] = useState\(100\);/g, 'const [health, setHealth] = useState(20);');

const profileHealthOld = `              <div className="flex items-center gap-1">
                {Array(5).fill(0).map((_, i) => (
                  <Heart key={i} size={20} className={i < Math.ceil(health / 2) ? 'text-red-500 fill-red-500' : 'text-neutral-800 fill-neutral-800'} />
                ))}
              </div>
              <div className="text-xs text-neutral-500 mt-2">{health} / 10 HP</div>`;

const profileHealthNew = `              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => {
                  const val = i * 2;
                  if (health >= val + 2) {
                     return <Heart key={i} size={20} className="text-red-500 fill-red-500" />;
                  } else if (health === val + 1) {
                     return (
                       <div key={i} className="relative w-5 h-5">
                         <Heart size={20} className="absolute text-neutral-800 fill-neutral-800" />
                         <div className="absolute w-1/2 h-full overflow-hidden">
                            <Heart size={20} className="text-red-500 fill-red-500" />
                         </div>
                       </div>
                     );
                  } else {
                     return <Heart key={i} size={20} className="text-neutral-800 fill-neutral-800" />;
                  }
                })}
              </div>
              <div className="text-xs text-neutral-500 mt-2">{health} / 20 HP</div>`;

code = code.replace(profileHealthOld, profileHealthNew);

const overlayHealthOld = `        {/* Health Bar */}
        <div className="absolute top-4 right-4 flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Heart 
              key={i} 
              className={\`w-6 h-6 \${i < health ? 'fill-red-500 text-red-500' : 'fill-transparent text-neutral-500 stroke-neutral-500 stroke-2'}\`} 
            />
          ))}
        </div>`;
        
const overlayHealthNew = `        {/* Health Bar */}
        <div className="absolute top-4 right-4 flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => {
             const val = i * 2;
             if (health >= val + 2) {
                return <Heart key={i} className="w-6 h-6 fill-red-500 text-red-500 stroke-red-500 stroke-2" />;
             } else if (health === val + 1) {
                return (
                  <div key={i} className="relative w-6 h-6">
                    <Heart className="absolute w-6 h-6 fill-transparent text-neutral-500 stroke-neutral-500 stroke-2" />
                    <div className="absolute w-1/2 h-full overflow-hidden">
                       <Heart className="w-6 h-6 fill-red-500 text-red-500 stroke-red-500 stroke-2" />
                    </div>
                  </div>
                );
             } else {
                return <Heart key={i} className="w-6 h-6 fill-transparent text-neutral-500 stroke-neutral-500 stroke-2" />;
             }
          })}
        </div>`;

code = code.replace(overlayHealthOld, overlayHealthNew);

fs.writeFileSync('src/App.tsx', code);
