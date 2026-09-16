import fs from 'fs';
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

const windStop = `
  stopWind: () => {
    if (windGain) {
       windGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
       setTimeout(() => {
          if (windGain) {
             windGain.disconnect();
             windGain = null;
          }
       }, 1000);
    }
  },
  startBattleMusic: () => {
`;
code = code.replace(/startBattleMusic: \(\) => \{/, windStop);
fs.writeFileSync('src/lib/audio.ts', code);
