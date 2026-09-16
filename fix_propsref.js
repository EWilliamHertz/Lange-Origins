import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(/const propsRef = useRef\(\{/g, "const propsRef = useRef({ nickname,");
code = code.replace(/propsRef\.current = \{ currentGang/g, "propsRef.current = { nickname, currentGang");
code = code.replace(/\}, \[selectedBlock/g, "}, [nickname, selectedBlock");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
