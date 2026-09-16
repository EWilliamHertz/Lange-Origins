import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const pGravOld = `         if (p.type === 'grenade') p.vy += 0.5; // gravity for grenade
         else p.vy += 0.1; // slight gravity for arrows/bullets`;
const pGravNew = `         if (p.type === 'grenade') p.vy += 0.5; // gravity for grenade
         else if (p.type !== 'magic') p.vy += 0.1; // slight gravity for arrows/bullets, magic has none`;
         
code = code.replace(pGravOld, pGravNew);

const pStatsOld = `                life: data.type === 'grenade' ? 60 : 40,
                damage: data.type === 'bullet' ? 15 : (data.type === 'arrow' ? 8 : 0)`;
const pStatsNew = `                life: data.type === 'grenade' ? 60 : (data.type === 'magic' ? 80 : 40),
                damage: data.type === 'bullet' ? 15 : (data.type === 'arrow' ? 8 : (data.type === 'magic' ? 25 : 0))`;
                
code = code.replace(pStatsOld, pStatsNew);

fs.writeFileSync('server.ts', code);
