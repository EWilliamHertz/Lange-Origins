import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(/onGangInvite\?: \(senderId: string, senderName: string\) => void;\n\s*currentGang\?: any;/, 
`onGangInvite?: (senderId: string, senderName: string) => void;
  currentGang?: any;
  onFireWeapon?: (weaponType: number) => void;`);

code = code.replace(/onTradeRequest, onGangInvite, currentGang, socketRef/, "onTradeRequest, onGangInvite, currentGang, socketRef, onFireWeapon");
code = code.replace(/propsRef\.current = \{ currentGang,/, "propsRef.current = { currentGang, onFireWeapon,");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
