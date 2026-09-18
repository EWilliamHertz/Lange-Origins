lines = open('src/components/GameCanvas.tsx').read().split('\n')

for i in range(len(lines)):
    if "const handleKeyDown = (e: KeyboardEvent) => {" in lines[i]:
        insert_code = """
      const castAbility = (abilityName: string) => {
          if (!abilityName || gameState.current.globalCooldown > 0 || !gameState.current.socket) return;
          const state = gameState.current;
          let cost = 0; let cd = 0;
          if (abilityName === 'slash' && (state.abilityCooldowns['slash'] || 0) <= 0) { cost = 0; cd = 3000; }
          else if (abilityName === 'whirlwind' && (state.abilityCooldowns['whirlwind'] || 0) <= 0) { cost = 15; cd = 8000; }
          else if (abilityName === 'dash' && (state.abilityCooldowns['dash'] || 0) <= 0) { cost = 10; cd = 5000; }
          else if (abilityName === 'fireball' && (state.abilityCooldowns['fireball'] || 0) <= 0) { cost = 10; cd = 5000; }
          else if (abilityName === 'frostbolt' && (state.abilityCooldowns['frostbolt'] || 0) <= 0) { cost = 15; cd = 6000; }
          else if (abilityName === 'heal' && (state.abilityCooldowns['heal'] || 0) <= 0) { cost = 20; cd = 10000; }
          else if (abilityName === 'shoot' && (state.abilityCooldowns['shoot'] || 0) <= 0) { cost = 0; cd = 2000; }
          else if (abilityName === 'snipe' && (state.abilityCooldowns['snipe'] || 0) <= 0) { cost = 20; cd = 10000; }
          else if (abilityName === 'trap' && (state.abilityCooldowns['trap'] || 0) <= 0) { cost = 15; cd = 15000; }

          if (cd > 0) {
              if (cost > 0) {
                  if ((propsRef.current.mana || 0) < cost) {
                      state.damageTexts.push({ id: Math.random().toString(), text: 'No Mana!', x: gameState.current.player.x, y: gameState.current.player.y - 15, life: 1, maxLife: 40, color: '#4444FF', size: 14 });
                      return;
                  }
                  if (propsRef.current.onManaChange) {
                      propsRef.current.onManaChange(propsRef.current.mana! - cost);
                  }
              }
              state.abilityCooldowns[abilityName] = cd;
              gameState.current.globalCooldown = 500; // 0.5s GCD
              
              const speed = 15;
              const vx = gameState.current.player.facingRight ? speed : -speed;
              
              if (abilityName === 'slash') {
                  gameState.current.player.slashAnim = 15;
                  state.socket.emit('use_ability', { ability: 'slash', facingRight: gameState.current.player.facingRight });
                  Sounds.sword();
              } else if (abilityName === 'whirlwind') {
                  gameState.current.player.slashAnim = 20;
                  state.socket.emit('use_ability', { ability: 'whirlwind' });
                  Sounds.sword();
              } else if (abilityName === 'dash') {
                  gameState.current.player.vx = gameState.current.player.facingRight ? 15 : -15;
                  state.socket.emit('use_ability', { ability: 'dash', facingRight: gameState.current.player.facingRight });
              } else if (abilityName === 'fireball') {
                  state.socket.emit('fire_projectile', { type: 'fireball', x: gameState.current.player.x, y: gameState.current.player.y - 12, vx: vx, vy: 0, damage: 30 + (propsRef.current.skills?.intelligence || 0) * 3 });
                  Sounds.fireball();
              } else if (abilityName === 'frostbolt') {
                  state.socket.emit('fire_projectile', { type: 'frostbolt', x: gameState.current.player.x, y: gameState.current.player.y - 12, vx: vx, vy: 0, damage: 20 + (propsRef.current.skills?.intelligence || 0) * 2 });
              } else if (abilityName === 'heal') {
                  state.socket.emit('use_ability', { ability: 'heal' });
                  gameState.current.player.healAnim = 30;
                  Sounds.heal();
              } else if (abilityName === 'shoot') {
                  state.socket.emit('fire_projectile', { type: 'arrow', x: gameState.current.player.x, y: gameState.current.player.y - 12, vx: vx * 1.5, vy: 0, damage: 10 + (propsRef.current.skills?.dexterity || 0) * 2 });
                  Sounds.shoot();
              } else if (abilityName === 'snipe') {
                  state.socket.emit('fire_projectile', { type: 'snipe_arrow', x: gameState.current.player.x, y: gameState.current.player.y - 12, vx: vx * 2, vy: 0, damage: 40 + (propsRef.current.skills?.dexterity || 0) * 4 });
                  Sounds.shoot();
              } else if (abilityName === 'trap') {
                  state.socket.emit('use_ability', { ability: 'trap' });
              }
          }
      };
      
      const handleCastAbilityEvent = (e: Event) => {
          const detail = (e as CustomEvent).detail;
          castAbility(detail.abilityId);
      };
      window.addEventListener('cast_ability', handleCastAbilityEvent);
      (window as any)._lastHandleCastAbilityEvent = handleCastAbilityEvent;
        """
        lines.insert(i, insert_code)
        break

start_idx = -1
for i in range(len(lines)):
    if "const abilityName = propsRef.current.keybinds?.[key];" in lines[i]:
        start_idx = i
        break

if start_idx != -1:
    end_idx = start_idx
    while "if (key === 'e') {" not in lines[end_idx]:
        end_idx += 1
    
    del lines[start_idx:end_idx]
    lines.insert(start_idx, """
      const abilityName = propsRef.current.keybinds?.[key];
      if (abilityName) {
          castAbility(abilityName);
      }
    """)

# Now in cleanup:
for i in range(len(lines)):
    if "window.removeEventListener('keydown', handleKeyDown);" in lines[i]:
        lines.insert(i, "      if ((window as any)._lastHandleCastAbilityEvent) window.removeEventListener('cast_ability', (window as any)._lastHandleCastAbilityEvent);")
        break

open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))
