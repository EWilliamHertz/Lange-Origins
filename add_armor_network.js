import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

// Update GameProps
code = code.replace(/characterSkin\?: string;/, "characterSkin?: string;\n  helmet?: boolean;\n  chestplate?: boolean;");

// Update destructuring
code = code.replace(/export default function Game\(\{ nickname, characterSkin,/, "export default function Game({ nickname, characterSkin, helmet, chestplate,");

// Update propsRef
code = code.replace(/propsRef\.current = \{ currentGang, onFireWeapon, characterSkin,/, "propsRef.current = { currentGang, onFireWeapon, characterSkin, helmet, chestplate,");

// Update emit
const playerUpdate = `
             socket.emit('player_update', {
               x: player.x,
               y: player.y,
               vx: player.vx,
               vy: player.vy,
               facingRight: player.facingRight,
               tool: propsRef.current.selectedBlock,
               isMining: currentIsMining,
               skin: propsRef.current.characterSkin || 'orange',
               name: propsRef.current.nickname || 'You',
               helmet: propsRef.current.helmet,
               chest: propsRef.current.chestplate
             });
`;
code = code.replace(/socket\.emit\('player_update', \{\n\s*x: player\.x,\n\s*y: player\.y,\n\s*vx: player\.vx,\n\s*vy: player\.vy,\n\s*facingRight: player\.facingRight,\n\s*tool: propsRef\.current\.selectedBlock,\n\s*isMining: currentIsMining,\n\s*skin: propsRef\.current\.characterSkin \|\| 'orange',\n\s*name: propsRef\.current\.nickname \|\| 'You'\n\s*\}\);/, playerUpdate);

// Update drawPlayer definition
const drawPlayerArgs = `
      const drawPlayer = (pX: number, pY: number, pVx: number, facingRight: boolean, skin: string, name: string, tool: BlockType | null = null, isMining: boolean = false, isGangMember: boolean = false, hasHelmet: boolean = false, hasChest: boolean = false) => {
`;
code = code.replace(/const drawPlayer = \(pX: number, pY: number, pVx: number, facingRight: boolean, skin: string, name: string, tool: BlockType \| null = null, isMining: boolean = false, isGangMember: boolean = false\) => \{/, drawPlayerArgs);

const drawArmor = `
        ctx.fillRect(pX, pY + bodyYOffset, pWidth, pHeight - 6);
        
        // Chestplate
        if (hasChest) {
           ctx.fillStyle = '#BDBDBD'; // Iron
           ctx.fillRect(pX - 1, pY + bodyYOffset - 1, pWidth + 2, pHeight - 6 + 2);
           ctx.fillStyle = '#9E9E9E'; // Outline/Detail
           ctx.fillRect(pX, pY + bodyYOffset + 2, pWidth, 4);
        }

        // Head
        ctx.fillStyle = headColor;
        ctx.fillRect(pX + 2, pY - 10 + bodyYOffset, pWidth - 4, 10);
        
        // Helmet
        if (hasHelmet) {
           ctx.fillStyle = '#BDBDBD';
           ctx.fillRect(pX, pY - 12 + bodyYOffset, pWidth, 6);
           ctx.fillRect(pX + 1, pY - 6 + bodyYOffset, pWidth - 2, 4);
        }
`;
code = code.replace(/ctx\.fillRect\(pX, pY \+ bodyYOffset, pWidth, pHeight - 6\);\n\n\s*\/\/ Head\n\s*ctx\.fillStyle = headColor;\n\s*ctx\.fillRect\(pX \+ 2, pY - 10 \+ bodyYOffset, pWidth - 4, 10\);/, drawArmor);

code = code.replace(/drawPlayer\(other\.x, other\.y, other\.vx, other\.facingRight, \(other as any\)\.skin \|\| 'blue', \(other as any\)\.name \|\| other\.id\.substring\(0, 4\), other\.tool, other\.isMining, isGang\);/, "drawPlayer(other.x, other.y, other.vx, other.facingRight, (other as any).skin || 'blue', (other as any).name || other.id.substring(0, 4), other.tool, other.isMining, isGang, (other as any).helmet, (other as any).chest);");
code = code.replace(/drawPlayer\(player\.x, player\.y, player\.vx, player\.facingRight, propsRef\.current\.characterSkin \|\| 'orange', propsRef\.current\.nickname \|\| 'You', selectedBlock, state\.miningProgress > 0\);/, "drawPlayer(player.x, player.y, player.vx, player.facingRight, propsRef.current.characterSkin || 'orange', propsRef.current.nickname || 'You', selectedBlock, state.miningProgress > 0, false, propsRef.current.helmet, propsRef.current.chestplate);");


fs.writeFileSync('src/components/GameCanvas.tsx', code);
