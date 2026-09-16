import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const \[appState, setAppState\] = useState\<'landing' \| 'serverBrowser' \| 'playing'\>\('landing'\);/, `const [appState, setAppState] = useState<'landing' | 'serverBrowser' | 'playing'>('landing');
  const [lobbyTab, setLobbyTab] = useState<'play' | 'marketplace'>('play');
  const [marketBlueprints, setMarketBlueprints] = useState<any[]>([]);`);

fs.writeFileSync('src/App.tsx', code);
