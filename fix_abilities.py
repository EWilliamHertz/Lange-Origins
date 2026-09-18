lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "export const MMO_ABILITIES = [" in lines[i]:
        insert = """
    { id: 'ground_slam', class: 'warrior', name: 'Ground Slam', desc: 'Slam the ground to damage enemies.', req: 8, cost: 20, cd: 12, icon: <Activity size={24}/> },
    { id: 'battle_shout', class: 'warrior', name: 'Battle Shout', desc: 'Heal yourself slightly and buff.', req: 10, cost: 25, cd: 20, icon: <Heart size={24} className="text-red-500" /> },
    { id: 'arcane_blast', class: 'mage', name: 'Arcane Blast', desc: 'A huge blast of magic energy.', req: 8, cost: 30, cd: 15, icon: <Activity size={24} className="text-purple-500"/> },
    { id: 'teleport', class: 'mage', name: 'Teleport', desc: 'Instantly travel a short distance.', req: 10, cost: 25, cd: 12, icon: <FastForward size={24} className="text-cyan-500"/> },
    { id: 'multishot', class: 'archer', name: 'Multishot', desc: 'Fire multiple arrows at once.', req: 8, cost: 25, cd: 8, icon: <Crosshair size={24} className="text-yellow-500"/> },
    { id: 'poison_arrow', class: 'archer', name: 'Poison Arrow', desc: 'Fire a toxic arrow.', req: 10, cost: 20, cd: 10, icon: <Crosshair size={24} className="text-green-500"/> },
"""
        lines.insert(i+1, insert)
        break
open('src/App.tsx', 'w').write('\n'.join(lines))

lines = open('src/components/GameCanvas.tsx').read().split('\n')
for i in range(len(lines)):
    if "else if (abilityName === 'trap' && (state.abilityCooldowns['trap'] || 0) <= 0) { cost = 15; cd = 15000; }" in lines[i]:
        insert = """
          else if (abilityName === 'ground_slam' && (state.abilityCooldowns['ground_slam'] || 0) <= 0) { cost = 20; cd = 12000; }
          else if (abilityName === 'battle_shout' && (state.abilityCooldowns['battle_shout'] || 0) <= 0) { cost = 25; cd = 20000; }
          else if (abilityName === 'arcane_blast' && (state.abilityCooldowns['arcane_blast'] || 0) <= 0) { cost = 30; cd = 15000; }
          else if (abilityName === 'teleport' && (state.abilityCooldowns['teleport'] || 0) <= 0) { cost = 25; cd = 12000; }
          else if (abilityName === 'multishot' && (state.abilityCooldowns['multishot'] || 0) <= 0) { cost = 25; cd = 8000; }
          else if (abilityName === 'poison_arrow' && (state.abilityCooldowns['poison_arrow'] || 0) <= 0) { cost = 20; cd = 10000; }
"""
        lines.insert(i+1, insert)
        break

for i in range(len(lines)):
    if "else if (abilityName === 'trap') {" in lines[i]:
        insert = """
              } else if (abilityName === 'ground_slam') {
                  gameState.current.player.slashAnim = 20;
                  state.socket.emit('use_ability', { ability: 'ground_slam' });
                  Sounds.sword();
              } else if (abilityName === 'battle_shout') {
                  state.socket.emit('use_ability', { ability: 'battle_shout' });
                  gameState.current.player.healAnim = 30;
                  Sounds.heal();
              } else if (abilityName === 'arcane_blast') {
                  state.socket.emit('fire_projectile', { type: 'arcane_blast', x: gameState.current.player.x, y: gameState.current.player.y - 12, vx: vx * 0.8, vy: 0, damage: 50 + (propsRef.current.skills?.intelligence || 0) * 5 });
                  Sounds.fireball();
              } else if (abilityName === 'teleport') {
                  state.socket.emit('use_ability', { ability: 'teleport', facingRight: gameState.current.player.facingRight });
                  gameState.current.player.healAnim = 10;
              } else if (abilityName === 'multishot') {
                  state.socket.emit('fire_projectile', { type: 'arrow', x: gameState.current.player.x, y: gameState.current.player.y - 12, vx: vx * 1.5, vy: -3, damage: 15 + (propsRef.current.skills?.dexterity || 0) * 2 });
                  state.socket.emit('fire_projectile', { type: 'arrow', x: gameState.current.player.x, y: gameState.current.player.y - 12, vx: vx * 1.5, vy: 0, damage: 15 + (propsRef.current.skills?.dexterity || 0) * 2 });
                  state.socket.emit('fire_projectile', { type: 'arrow', x: gameState.current.player.x, y: gameState.current.player.y - 12, vx: vx * 1.5, vy: 3, damage: 15 + (propsRef.current.skills?.dexterity || 0) * 2 });
                  Sounds.shoot();
              } else if (abilityName === 'poison_arrow') {
                  state.socket.emit('fire_projectile', { type: 'poison_arrow', x: gameState.current.player.x, y: gameState.current.player.y - 12, vx: vx * 1.2, vy: 0, damage: 20 + (propsRef.current.skills?.dexterity || 0) * 3 });
                  Sounds.shoot();
"""
        lines.insert(i+1, insert)
        break
open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))

