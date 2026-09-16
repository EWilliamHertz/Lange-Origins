import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

// 1. Update GameProps interface
const oldProps = `interface GameProps {
  nickname: string;
  characterSkin?: string;
  helmet?: boolean;
  chestplate?: boolean;`;
  
const newProps = `interface GameProps {
  nickname: string;
  characterSkin?: string;
  helmet?: number | null;
  chestplate?: number | null;`;
  
code = code.replace(oldProps, newProps);

// 2. Update take_damage mitigation calculation
const oldDmgClient = `          const mitigation = (propsRef.current.helmet ? 0.3 : 0) + (propsRef.current.chestplate ? 0.3 : 0);
          const finalDamage = Math.max(1, Math.floor(data.damage * (1 - mitigation)));`;

const newDmgClient = `          const hTier = propsRef.current.helmet;
          const cTier = propsRef.current.chestplate;
          const hMitig = hTier === 409 ? 0.35 : (hTier === 407 ? 0.2 : (hTier === 400 ? 0.3 : 0));
          const cMitig = cTier === 410 ? 0.45 : (cTier === 408 ? 0.25 : (cTier === 401 ? 0.35 : 0));
          const mitigation = hMitig + cMitig;
          const finalDamage = Math.max(1, Math.floor(data.damage * (1 - mitigation)));`;
          
code = code.replace(oldDmgClient, newDmgClient);

// 3. Update collision mitigation calculation
const oldDmgServer = `                               const mitigation = (propsRef.current.helmet ? 0.3 : 0) + (propsRef.current.chestplate ? 0.3 : 0);
                               const finalDamage = Math.max(1, Math.floor(baseDmg * (1 - mitigation)));`;

const newDmgServer = `                               const hTier = propsRef.current.helmet;
                               const cTier = propsRef.current.chestplate;
                               const hMitig = hTier === 409 ? 0.35 : (hTier === 407 ? 0.2 : (hTier === 400 ? 0.3 : 0));
                               const cMitig = cTier === 410 ? 0.45 : (cTier === 408 ? 0.25 : (cTier === 401 ? 0.35 : 0));
                               const mitigation = hMitig + cMitig;
                               const finalDamage = Math.max(1, Math.floor(baseDmg * (1 - mitigation)));`;

code = code.replace(oldDmgServer, newDmgServer);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
