import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /if\s*\(appState\s*===\s*'landing'\)\s*\{\s*<LandingPage/;
const replacement = `if (appState === 'landing') {\n    return (\n      <LandingPage`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code);
