const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const badLogic = `      if (isChatOpen) {
        if (e.key === 'Escape') {
        if (merchantOpen) {
          setMerchantOpen(false);
          setCursorItem(null);
          return;
        }
          setIsChatOpen(false);
        }
        return; // Disable other game keys while chatting
      }`;

const fixedLogic = `      if (isChatOpen) {
        if (e.key === 'Escape') {
          setIsChatOpen(false);
        }
        if (e.key !== 'Escape') {
          return; // Disable other game keys while chatting unless it's escape
        }
      }`;

code = code.replace(badLogic, fixedLogic);

fs.writeFileSync('src/App.tsx', code);
console.log('Escape logic patched.');
