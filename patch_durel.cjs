const fs = require('fs');

let canvasCode = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');
canvasCode = canvasCode.replace(
  "block === BlockType.QuestNPC || block === BlockType.GuideNPC || block === BlockType.GoblinNPC || block === BlockType.WizardNPC",
  "block === BlockType.QuestNPC || block === BlockType.GuideNPC || block === BlockType.GoblinNPC || block === BlockType.WizardNPC || block === BlockType.DurelNPC"
);
fs.writeFileSync('src/components/GameCanvas.tsx', canvasCode);

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
const interactMatch = "if (blockType === BlockType.QuestNPC || blockType === BlockType.GuideNPC || blockType === BlockType.GoblinNPC || blockType === BlockType.WizardNPC) {\n              setShowNPCMessage(true);\n            }";

const newInteract = `if (blockType === BlockType.QuestNPC || blockType === BlockType.GuideNPC || blockType === BlockType.GoblinNPC || blockType === BlockType.WizardNPC) {
              setShowNPCMessage(true);
            }
            if (blockType === BlockType.DurelNPC) {
              alert("DUREL: YOU HAVE SLAIN " + (kills || 0) + " CREATURES SO FAR!");
            }`;

appCode = appCode.replace(interactMatch, newInteract);
fs.writeFileSync('src/App.tsx', appCode);

console.log('Durel interaction patched');
