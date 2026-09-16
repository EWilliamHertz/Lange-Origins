import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const drawPlayerSigOld = `      const drawPlayer = (pX: number, pY: number, pVx: number, facingRight: boolean, skin: string, name: string, tool: BlockType | null = null, isMining: boolean = false, isGangMember: boolean = false, hasHelmet: boolean = false, hasChest: boolean = false) => {`;

const drawPlayerSigNew = `      const drawPlayer = (pX: number, pY: number, pVx: number, facingRight: boolean, skin: string, name: string, tool: BlockType | null = null, isMining: boolean = false, isGangMember: boolean = false, helmetTier: number | null = null, chestTier: number | null = null) => {`;

code = code.replace(drawPlayerSigOld, drawPlayerSigNew);

const drawArmorCodeOld = `        // Eyes
        ctx.fillStyle = '#000';
        const eyeOffset = facingRight ? 14 : 4;
        const headY = pY - 6 + bodyYOffset;
        ctx.fillRect(pX - 2 + eyeOffset, headY, 4, 4);
        ctx.fillRect(pX - 2 + eyeOffset + 6, headY, 4, 4);`;

const drawArmorCodeNew = `        // Eyes
        ctx.fillStyle = '#000';
        const eyeOffset = facingRight ? 14 : 4;
        const headY = pY - 6 + bodyYOffset;
        ctx.fillRect(pX - 2 + eyeOffset, headY, 4, 4);
        ctx.fillRect(pX - 2 + eyeOffset + 6, headY, 4, 4);
        
        // Armor (Chestplate)
        if (chestTier !== null) {
            ctx.fillStyle = chestTier === 410 ? '#00ACC1' : (chestTier === 408 ? '#FBC02D' : '#BDBDBD');
            // Draw a plate over the chest
            ctx.fillRect(pX - 1, pY + bodyYOffset - 1, pWidth + 2, pHeight - 4);
        }
        
        // Armor (Helmet)
        if (helmetTier !== null) {
            ctx.fillStyle = helmetTier === 409 ? '#4DD0E1' : (helmetTier === 407 ? '#FFD54F' : '#9E9E9E');
            ctx.fillRect(pX - 3, pY - 13 + bodyYOffset, pWidth + 6, 8); // Top
            ctx.fillRect(pX - 3, pY - 5 + bodyYOffset, 4, 6); // Side
            ctx.fillRect(pX + pWidth - 1, pY - 5 + bodyYOffset, 4, 6); // Side
        }`;

code = code.replace(drawArmorCodeOld, drawArmorCodeNew);

const callPlayerLocalOld = `      drawPlayer(player.x, player.y, player.vx, player.facingRight, propsRef.current.characterSkin || 'orange', propsRef.current.nickname || 'You', selectedBlock, state.miningProgress > 0, false, propsRef.current.helmet, propsRef.current.chestplate);`;
const callPlayerLocalNew = `      drawPlayer(player.x, player.y, player.vx, player.facingRight, propsRef.current.characterSkin || 'orange', propsRef.current.nickname || 'You', selectedBlock, state.miningProgress > 0, false, propsRef.current.helmet || null, propsRef.current.chestplate || null);`;
code = code.replace(callPlayerLocalOld, callPlayerLocalNew);

const callPlayerOtherOld = `        drawPlayer(other.x, other.y, other.vx, other.facingRight, (other as any).skin || 'blue', (other as any).name || other.id.substring(0, 4), other.tool, other.isMining, isGang, (other as any).helmet, (other as any).chest);`;
const callPlayerOtherNew = `        drawPlayer(other.x, other.y, other.vx, other.facingRight, (other as any).skin || 'blue', (other as any).name || other.id.substring(0, 4), other.tool, other.isMining, isGang, (other as any).helmet, (other as any).chest);`;
// Hmm wait, is helmet sent in socket state?
code = code.replace(callPlayerOtherOld, callPlayerOtherNew);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
