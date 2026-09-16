const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
if (!code.includes('Sword,')) {
    code = code.replace("Settings, LogOut,", "Settings, LogOut, Sword,");
}
fs.writeFileSync('src/App.tsx', code);
