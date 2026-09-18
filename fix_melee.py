lines = open('src/components/GameCanvas.tsx').read().split('\n')
for i in range(960, 975):
    if "let hitMob = false;" in lines[i]:
        insert_code = """
        const sel = propsRef.current.selectedBlock;
        const isFist = sel === BlockType.Fists || sel === null || sel === 0;
        const isSword = sel === BlockType.WoodSword || sel === BlockType.StoneSword || sel === BlockType.IronSword || sel === 402 || sel === 403;
        const isPickaxe = sel === BlockType.WoodPickaxe || sel === BlockType.StonePickaxe || sel === BlockType.IronPickaxe;
        const isAxe = sel === BlockType.WoodAxe || sel === BlockType.StoneAxe || sel === BlockType.IronAxe;
        
        if ((isFist || isSword || isPickaxe || isAxe) && state.interactionCooldown <= 0) {
            const mx = gameState.current.mouseX + state.cameraX;
            const my = gameState.current.mouseY + state.cameraY;
            for (const [id, mob] of Object.entries(state.mobs)) {
                const m = mob as any;
                const px = m.x - 12;
                const py = m.y - 24;
                if (mx >= px && mx <= px + 48 && my >= py && my <= py + 48) {
                    const mDist = Math.hypot(m.x - player.x, m.y - player.y);
                    if (mDist <= ATTACK_RANGE) {
                        const baseDmg = isSword ? (sel === BlockType.IronSword ? 8 : 5)
                                      : isAxe ? (sel === BlockType.IronAxe ? 6 : 4)
                                      : isPickaxe ? (sel === BlockType.IronPickaxe ? 5 : 3)
                                      : isFist ? 3 : 1;
                        const dmg = baseDmg + (propsRef.current.skills?.strength || 0) * 2;
                        if (state.socket) state.socket.emit('hit_mob', { mobId: id, damage: dmg, facingRight: player.x < m.x, playerId: state.socket?.id });
                        player.slashAnim = 15;
                        Sounds.sword();
                        player.facingRight = player.x < m.x;
                        state.interactionCooldown = 500;
                        hitMob = true;
                        if (propsRef.current.onToolDurabilityLoss && !isFist) propsRef.current.onToolDurabilityLoss();
                        break;
                    }
                }
            }
        }
        """
        lines.insert(i+1, insert_code)
        break

open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))
