import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

// Update GameProps
code = code.replace(/nickname: string;/, "nickname: string;\n  characterSkin?: string;");

// Update destructuring
code = code.replace(/export default function Game\(\{ nickname,/, "export default function Game({ nickname, characterSkin,");

// Update propsRef
code = code.replace(/propsRef\.current = \{ currentGang, onFireWeapon,/, "propsRef.current = { currentGang, onFireWeapon, characterSkin,");
code = code.replace(/const isGun = propsRef\.current\.selectedBlock === 302;/, "const characterSkin = propsRef.current.characterSkin || 'orange';\n        const isGun = propsRef.current.selectedBlock === 302;");

// Update drawPlayer definition
const newDrawPlayer = `
      const drawPlayer = (pX: number, pY: number, pVx: number, facingRight: boolean, skin: string, name: string, tool: BlockType | null = null, isMining: boolean = false, isGangMember: boolean = false) => {
        const pWidth = player.width;
        const pHeight = player.height;
        const isMoving = Math.abs(pVx) > 0.5;
        const walkCycle = isMoving ? Math.sin(timestamp * 0.015) * 5 : 0;
        
        let darkColor = '#E65100';
        let mainColor = '#FF9800';
        let armColor = '#F57C00';
        let headColor = '#FFE0B2';
        
        switch (skin) {
           case 'blue': darkColor = '#0D47A1'; mainColor = '#2196F3'; armColor = '#1976D2'; headColor = '#BBDEFB'; break;
           case 'green': darkColor = '#1B5E20'; mainColor = '#4CAF50'; armColor = '#388E3C'; headColor = '#C8E6C9'; break;
           case 'red': darkColor = '#B71C1C'; mainColor = '#F44336'; armColor = '#D32F2F'; headColor = '#FFCDD2'; break;
           case 'purple': darkColor = '#4A148C'; mainColor = '#9C27B0'; armColor = '#7B1FA2'; headColor = '#E1BEE7'; break;
           case 'pink': darkColor = '#880E4F'; mainColor = '#E91E63'; armColor = '#C2185B'; headColor = '#F8BBD0'; break;
           case 'gray': darkColor = '#212121'; mainColor = '#9E9E9E'; armColor = '#616161'; headColor = '#F5F5F5'; break;
           case 'orange': default: darkColor = '#E65100'; mainColor = '#FF9800'; armColor = '#F57C00'; headColor = '#FFE0B2'; break;
        }

        // Back Leg
        ctx.fillStyle = darkColor;
        ctx.fillRect(
`;
code = code.replace(/const drawPlayer = \(pX: number, pY: number, pVx: number, facingRight: boolean, colorBase: string, name: string, tool: BlockType \| null = null, isMining: boolean = false, isGangMember: boolean = false\) => \{\n\s*const pWidth = player\.width;\n\s*const pHeight = player\.height;\n\s*const isMoving = Math\.abs\(pVx\) > 0\.5;\n\s*const walkCycle = isMoving \? Math\.sin\(timestamp \* 0\.015\) \* 5 : 0;\n\s*\/\/ Back Leg\n\s*ctx\.fillStyle = colorBase === 'blue' \? '#0D47A1' : '#E65100'; \/\/ Darker base\n\s*ctx\.fillRect\(/, newDrawPlayer);

code = code.replace(/ctx\.fillStyle = colorBase === 'blue' \? '#2196F3' : '#FF9800';/, "ctx.fillStyle = mainColor;");
code = code.replace(/ctx\.fillStyle = colorBase === 'blue' \? '#BBDEFB' : '#FFE0B2';/, "ctx.fillStyle = headColor;");
code = code.replace(/ctx\.fillStyle = colorBase === 'blue' \? '#1976D2' : '#F57C00';/, "ctx.fillStyle = armColor;");

// Update player emission
code = code.replace(/socket\.emit\('join', \{ roomId \}\);/, "socket.emit('join', { roomId, skin: propsRef.current.characterSkin || 'orange', nickname: propsRef.current.nickname || 'You' });");
code = code.replace(/socket\.emit\('player_update', \{\n\s*x: player\.x,\n\s*y: player\.y,\n\s*vx: player\.vx,\n\s*vy: player\.vy,\n\s*facingRight: player\.facingRight,\n\s*tool: propsRef\.current\.selectedBlock,\n\s*isMining: currentIsMining\n\s*\}\);/, "socket.emit('player_update', {\n               x: player.x,\n               y: player.y,\n               vx: player.vx,\n               vy: player.vy,\n               facingRight: player.facingRight,\n               tool: propsRef.current.selectedBlock,\n               isMining: currentIsMining,\n               skin: propsRef.current.characterSkin || 'orange',\n               name: propsRef.current.nickname || 'You'\n             });");

// Also update drawPlayer calls
code = code.replace(/drawPlayer\(other\.x, other\.y, other\.vx, other\.facingRight, 'blue', \(other as any\)\.name \|\| other\.id\.substring\(0, 4\), other\.tool, other\.isMining, isGang\);/, "drawPlayer(other.x, other.y, other.vx, other.facingRight, (other as any).skin || 'blue', (other as any).name || other.id.substring(0, 4), other.tool, other.isMining, isGang);");
code = code.replace(/drawPlayer\(player\.x, player\.y, player\.vx, player\.facingRight, 'orange', propsRef\.current\.nickname \|\| 'You', selectedBlock, state\.miningProgress > 0\);/, "drawPlayer(player.x, player.y, player.vx, player.facingRight, propsRef.current.characterSkin || 'orange', propsRef.current.nickname || 'You', selectedBlock, state.miningProgress > 0);");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
