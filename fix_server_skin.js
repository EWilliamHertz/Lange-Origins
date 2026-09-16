import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/players: Record<string, \{ x: number, y: number, vx: number, vy: number, facingRight: boolean, tool\?: number \| null, isMining\?: boolean, gangId\?: string }>;/, "players: Record<string, { x: number, y: number, vx: number, vy: number, facingRight: boolean, tool?: number | null, isMining?: boolean, gangId?: string, skin?: string, name?: string }>;");

code = code.replace(/socket\.on\('join', \(data: \{ roomId: string \}\) => \{/, "socket.on('join', (data: { roomId: string, skin?: string, name?: string }) => {");

const joinInit = `
      activeRooms[targetRoom].players[socket.id] = { 
         x: Math.floor(WORLD_WIDTH / 2) * 32, 
         y: 30 * 32, 
         vx: 0, 
         vy: 0, 
         facingRight: true,
         skin: data.skin || 'blue',
         name: data.name || socket.id.substring(0, 4)
      };
`;
code = code.replace(/activeRooms\[targetRoom\]\.players\[socket\.id\] = \{ x: Math\.floor\(WORLD_WIDTH \/ 2\) \* 32, y: 30 \* 32, vx: 0, vy: 0, facingRight: true \};/, joinInit);

code = code.replace(/socket\.on\('player_update', \(data: \{x: number, y: number, vx: number, vy: number, facingRight: boolean, tool\?: number \| null, isMining\?: boolean\}\) => \{/, "socket.on('player_update', (data: {x: number, y: number, vx: number, vy: number, facingRight: boolean, tool?: number | null, isMining?: boolean, skin?: string, name?: string}) => {");

const updateData = `
        player.isMining = data.isMining;
        if (data.skin) player.skin = data.skin;
        if (data.name) player.name = data.name;
`;
code = code.replace(/player\.isMining = data\.isMining;/, updateData);

fs.writeFileSync('server.ts', code);
