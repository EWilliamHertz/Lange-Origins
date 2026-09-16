import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/\{filteredRecipes\.map\(\(recipe, index\) => \([\s\S]*?\)\)}\n\s*<\/div>\n\s*<\/div>\n\s*\)}/, 
`{filteredRecipes.map((recipe, index) => (
                       <div key={index} className="bg-neutral-900 border border-neutral-700 p-4 rounded-xl flex items-center gap-6">
                         <div className="grid grid-cols-3 gap-1">
                           {recipe.pattern.map((bt, i) => (
                             <div key={i} className="w-8 h-8 p-1 bg-black/50 rounded flex items-center justify-center">
                               {renderBlockIcon(bt)}
                             </div>
                           ))}
                         </div>
                         <ArrowRight className="text-neutral-500 w-6 h-6" />
                         <div className="w-12 h-12 p-1.5 bg-black/50 rounded-lg border border-neutral-600 flex items-center justify-center">
                           {renderBlockIcon(recipe.result)}
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}`);

fs.writeFileSync('src/App.tsx', code);
