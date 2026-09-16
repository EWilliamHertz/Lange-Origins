import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const handleSmeltReplacement = `  const handleSmelt = () => {
    if (furnaceFuel?.type === BlockType.Coal && furnaceInput) {
      let outputType: BlockType | null = null;
      if (furnaceInput.type === BlockType.IronOre) outputType = BlockType.IronIngot;
      if (furnaceInput.type === BlockType.GoldOre) outputType = BlockType.GoldIngot;
      if (furnaceInput.type === BlockType.DiamondOre) outputType = BlockType.Diamond;
      if (furnaceInput.type === BlockType.Sand) outputType = BlockType.Glass;
      
      if (outputType) {
        if (furnaceOutput && (furnaceOutput.type !== outputType || furnaceOutput.count >= 64)) {
            return;
        }

        if (furnaceFuel.count > 1) {
            setFurnaceFuel({ ...furnaceFuel, count: furnaceFuel.count - 1 });
        } else {
            setFurnaceFuel(null);
        }

        if (furnaceInput.count > 1) {
            setFurnaceInput({ ...furnaceInput, count: furnaceInput.count - 1 });
        } else {
            setFurnaceInput(null);
        }

        if (furnaceOutput) {
            setFurnaceOutput({ ...furnaceOutput, count: furnaceOutput.count + 1 });
        } else {
            setFurnaceOutput({ type: outputType, count: 1 });
        }
      }
    }
  };`;

code = code.replace(/  const handleSmelt = \(\) => \{[\s\S]*?    \}\n  \};\n/, handleSmeltReplacement + '\n');
code = code.replace(/disabled=\{furnaceFuel !== BlockType\.Coal \|\| !furnaceInput\}/, 'disabled={furnaceFuel?.type !== BlockType.Coal || !furnaceInput}');

fs.writeFileSync('src/App.tsx', code);
