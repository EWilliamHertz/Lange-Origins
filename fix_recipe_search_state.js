import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const searchState = `
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
`;
code = code.replace(/const \[inventoryTab, setInventoryTab\] = useState<'crafting' \| 'guide'>\('crafting'\);/, "const [inventoryTab, setInventoryTab] = useState<'crafting' | 'guide'>('crafting');\n" + searchState);

const filterLogic = `
  const filteredRecipes = RECIPES.filter(recipe => {
     const name = BlockNames[recipe.result].toLowerCase();
     return name.includes(recipeSearchQuery.toLowerCase());
  });
`;
code = code.replace(/const activeQuests = quests.filter/, filterLogic + "\n  const activeQuests = quests.filter");

fs.writeFileSync('src/App.tsx', code);
