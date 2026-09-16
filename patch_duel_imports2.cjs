const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace("Volume2, VolumeX } from 'lucide-react'", "Volume2, VolumeX, Sword } from 'lucide-react'");
fs.writeFileSync('src/App.tsx', code);
