import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const searchState = `
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
`;
code = code.replace(/const \[activeTab, setActiveTab\] = useState<'crafting' \| 'guide'>\('crafting'\);/, "const [activeTab, setActiveTab] = useState<'crafting' | 'guide'>('crafting');\n" + searchState);

const filterLogic = `
  const filteredRecipes = RECIPES.filter(recipe => {
     const name = BlockNames[recipe.result].toLowerCase();
     return name.includes(recipeSearchQuery.toLowerCase());
  });
`;
code = code.replace(/const activeQuests = quests.filter/, filterLogic + "\n  const activeQuests = quests.filter");

const uiLogic = `
              ) : (
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                     <input 
                       type="text" 
                       placeholder="Search recipes..." 
                       value={recipeSearchQuery}
                       onChange={(e) => setRecipeSearchQuery(e.target.value)}
                       className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-neutral-500"
                     />
                  </div>
                  <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 min-h-[300px]">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {filteredRecipes.map((recipe, index) => (
`;
code = code.replace(/\) : \(\n\s*<div className="overflow-y-auto custom-scrollbar pr-2 flex-1 min-h-\[300px\]">\n\s*<div className="grid grid-cols-1 md:grid-cols-2 gap-4">\n\s*\{RECIPES\.map\(\(recipe, index\) => \(/, uiLogic);

fs.writeFileSync('src/App.tsx', code);
