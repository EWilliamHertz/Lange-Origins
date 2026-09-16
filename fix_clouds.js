import fs from 'fs';
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

code = code.replace(/duration: 40/g, 'duration: 8');
code = code.replace(/duration: 60/g, 'duration: 12');
code = code.replace(/duration: 50/g, 'duration: 10');
code = code.replace(/duration: 80/g, 'duration: 16');

fs.writeFileSync('src/components/LandingPage.tsx', code);
