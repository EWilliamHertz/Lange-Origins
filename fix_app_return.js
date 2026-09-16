import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const badLanding = `  if (appState === 'landing') {
      <LandingPage`;
const goodLanding = `  if (appState === 'landing') {
    return (
      <LandingPage`;
      
code = code.replace(badLanding, goodLanding);

fs.writeFileSync('src/App.tsx', code);
