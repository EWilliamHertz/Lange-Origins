import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const furnaceEffect = `
  const [smeltProgress, setSmeltProgress] = useState(0);

  useEffect(() => {
     let interval;
     if (furnaceFuel?.type === BlockType.Coal && furnaceInput) {
        let isValid = false;
        if (furnaceInput.type === BlockType.IronOre) isValid = true;
        if (furnaceInput.type === BlockType.GoldOre) isValid = true;
        if (furnaceInput.type === BlockType.DiamondOre) isValid = true;
        if (furnaceInput.type === BlockType.Sand) isValid = true;
        if (furnaceInput.type === BlockType.CoalOre) isValid = true;
        
        if (isValid) {
            interval = setInterval(() => {
                setSmeltProgress(prev => {
                    if (prev >= 100) {
                        handleSmelt();
                        return 0;
                    }
                    return prev + 10; // 10% per tick (e.g. 100ms)
                });
            }, 200); // 2 seconds to smelt
        } else {
            setSmeltProgress(0);
        }
     } else {
         setSmeltProgress(0);
     }
     return () => clearInterval(interval);
  }, [furnaceFuel, furnaceInput, furnaceOutput]);
`;

code = code.replace(/const handleSmelt = \(\) => \{/, furnaceEffect + "\n  const handleSmelt = () => {");
fs.writeFileSync('src/App.tsx', code);
