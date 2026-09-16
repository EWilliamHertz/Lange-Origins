import fs from 'fs';
let codeApp = fs.readFileSync('src/App.tsx', 'utf8');

const filterLogic = `
  const filteredRecipes = RECIPES.filter(recipe => {
     const name = BlockNames[recipe.result].toLowerCase();
     return name.includes(recipeSearchQuery.toLowerCase());
  });
`;
codeApp = codeApp.replace(/return \(\n\s*<div className="w-full h-screen bg-neutral-900/, filterLogic + "\n  return (\n    <div className=\"w-full h-screen bg-neutral-900");
fs.writeFileSync('src/App.tsx', codeApp);

let codeConstants = fs.readFileSync('src/lib/constants.ts', 'utf8');
codeConstants = codeConstants.replace(/\[BlockType\.Apple\]: '#F44336'/, "[BlockType.Apple]: '#F44336',\n  [BlockType.Snow]: '#FFFFFF',\n  [BlockType.Ice]: '#B3E5FC'");
codeConstants = codeConstants.replace(/\[BlockType\.Apple\]: 0/, "[BlockType.Apple]: 0,\n  [BlockType.Snow]: 0.5,\n  [BlockType.Ice]: 1");
codeConstants = codeConstants.replace(/\[BlockType\.Apple\]: 'Apple'/, "[BlockType.Apple]: 'Apple',\n  [BlockType.Snow]: 'Snow Block',\n  [BlockType.Ice]: 'Ice'");
fs.writeFileSync('src/lib/constants.ts', codeConstants);

let codeCanvas = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');
codeCanvas = codeCanvas.replace(/colorBase === 'blue'/g, "skin === 'blue'");
fs.writeFileSync('src/components/GameCanvas.tsx', codeCanvas);
