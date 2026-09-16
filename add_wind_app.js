import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const windEffect = `
  useEffect(() => {
    if (appState === 'playing') {
      Sounds.startWind();
    } else {
      Sounds.stopWind();
      Sounds.stopBattleMusic();
    }
  }, [appState]);

  useEffect(() => {
`;
code = code.replace(/useEffect\(\(\) => \{/, windEffect);
fs.writeFileSync('src/App.tsx', code);
