import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `  if (appState === 'landing') {
      <LandingPage `,
  `  if (appState === 'landing') {
    return (
      <LandingPage `
);

fs.writeFileSync('src/App.tsx', code);
