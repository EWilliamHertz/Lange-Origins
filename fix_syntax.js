import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/          onPlayerInteract=\{\(playerId, playerName\) => \{\n            setInteractPlayerId\(playerId\);\n            setInteractPlayerName\(playerName\);\n          \}\} : null;\n              \}\n              return next;\n            \}\}\n          onBlockMined/g, 
`          onPlayerInteract={(playerId, playerName) => {
            setInteractPlayerId(playerId);
            setInteractPlayerName(playerName);
          }}
          onBlockMined`);

fs.writeFileSync('src/App.tsx', code);
