import re
with open('src/components/GameCanvas.tsx', 'r') as f:
    content = f.read()

# Add to player state
content = content.replace("invulnerableTimer: 0,", "invulnerableTimer: 0, slashAnim: 0, healAnim: 0,")

# Update animation timers
update_timers = """        player.invulnerableTimer -= 16;
        if (player.slashAnim > 0) player.slashAnim -= 1;
        if (player.healAnim > 0) player.healAnim -= 1;"""
content = content.replace("        player.invulnerableTimer -= 16;", update_timers)

# Draw slash anim
draw_player_old = "      const drawPlayer = (pX: number, pY: number, pVx: number, facingRight: boolean, skin: string, name: string, tool: BlockType | null = null, isMining: boolean = false, isGangMember: boolean = false, helmetTier: number | null = null, chestTier: number | null = null) => {"
draw_player_new = "      const drawPlayer = (pX: number, pY: number, pVx: number, facingRight: boolean, skin: string, name: string, tool: BlockType | null = null, isMining: boolean = false, isGangMember: boolean = false, helmetTier: number | null = null, chestTier: number | null = null, slashAnim: number = 0, healAnim: number = 0) => {"
content = content.replace(draw_player_old, draw_player_new)

# Render slash anim
render_slash = """        if (tool !== null && tool !== BlockType.Fists && tool !== BlockType.Air) {
          ctx.save();
          if (facingRight) {
             ctx.translate(16, 20);
             if (isMining) ctx.rotate((Date.now() % 400) / 400 * Math.PI / 2);
             if (slashAnim > 0) ctx.rotate(Math.PI / 2 * (1 - slashAnim / 15));
             ctx.drawImage(getBlockImage(tool), 0, -16, 16, 16);
          } else {
             ctx.translate(-16, 20);
             if (isMining) ctx.rotate(-(Date.now() % 400) / 400 * Math.PI / 2);
             if (slashAnim > 0) ctx.rotate(-Math.PI / 2 * (1 - slashAnim / 15));
             ctx.scale(-1, 1);
             ctx.drawImage(getBlockImage(tool), 0, -16, 16, 16);
          }
          ctx.restore();
        } else if (slashAnim > 0) {
          // Unarmed slash
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.beginPath();
          if (facingRight) ctx.arc(12, 18, 15, -Math.PI/2, Math.PI/2 * (1 - slashAnim/15));
          else ctx.arc(-12, 18, 15, Math.PI/2 + Math.PI/2 * (slashAnim/15), Math.PI*1.5);
          ctx.stroke();
        }
        
        if (healAnim > 0) {
            ctx.fillStyle = `rgba(0, 255, 100, ${healAnim / 30})`;
            ctx.beginPath();
            ctx.arc(0, 18, 25 + (30 - healAnim), 0, Math.PI * 2);
            ctx.fill();
        }"""
content = re.sub(r'        if \(tool !== null && tool !== BlockType\.Fists && tool !== BlockType\.Air\) \{.+?        \}', render_slash, content, flags=re.DOTALL)

# Pass anim to drawPlayer calls
content = content.replace("drawPlayer(other.x, other.y, other.vx, other.facingRight, (other as any).skin || 'blue', (other as any).name || other.id.substring(0, 4), other.tool, other.isMining, isGang, (other as any).helmet, (other as any).chest);", "drawPlayer(other.x, other.y, other.vx, other.facingRight, (other as any).skin || 'blue', (other as any).name || other.id.substring(0, 4), other.tool, other.isMining, isGang, (other as any).helmet, (other as any).chest, (other as any).slashAnim || 0, (other as any).healAnim || 0);")
content = content.replace("drawPlayer(player.x, player.y, player.vx, player.facingRight, propsRef.current.characterSkin || 'orange', propsRef.current.nickname || 'You', selectedBlock, state.miningProgress > 0, false, propsRef.current.helmet || null, propsRef.current.chestplate || null);", "drawPlayer(player.x, player.y, player.vx, player.facingRight, propsRef.current.characterSkin || 'orange', propsRef.current.nickname || 'You', selectedBlock, state.miningProgress > 0, false, propsRef.current.helmet || null, propsRef.current.chestplate || null, player.slashAnim, player.healAnim);")

with open('src/components/GameCanvas.tsx', 'w') as f:
    f.write(content)
