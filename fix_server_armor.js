import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const updateOld = `socket.on('player_update',
 (data: {x: number, y: number, vx: number, vy: number, facingRight: boolean, tool?: number | null, isMining?: boolean, skin?: string, name?: string, helmet?: boolean, chest?: boolean}) => {`;
const updateNew = `socket.on('player_update',
 (data: {x: number, y: number, vx: number, vy: number, facingRight: boolean, tool?: number | null, isMining?: boolean, skin?: string, name?: string, helmet?: number | null, chest?: number | null}) => {`;
 
code = code.replace(updateOld, updateNew);
fs.writeFileSync('server.ts', code);
