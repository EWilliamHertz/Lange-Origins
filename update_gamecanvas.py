lines = open('src/components/GameCanvas.tsx').read().split('\n')
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "const abilityName = propsRef.current.keybinds?.[key];" in line:
        start_idx = i
        break

for i in range(start_idx, len(lines)):
    if "gameState.current.keys[key] = true;" in lines[i]:
        break # not what we are looking for

# Actually let's just find exactly where the ability cast is
for i, line in enumerate(lines):
    if "      // MMO Abilities" in line:
        start_idx = i
        break

for i in range(start_idx, len(lines)):
    if "if (key === ' ' || key === 'ArrowUp' || key === 'w') {" in lines[i]:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    old_block = lines[start_idx:end_idx]
    
    new_block = """
      const castAbility = (abilityName: string) => {
          if (!abilityName || gameState.current.globalCooldown > 0 || !gameState.current.socket) return;
          const state = gameState.current;
          let cost = 0; let cd = 0;
          if (abilityName === 'slash' && (state.abilityCooldowns['slash'] || 0) <= 0) { cost = 0; cd = 3000; }
          else if (abilityName === 'fireball' && (state.abilityCooldowns['fireball'] || 0) <= 0) { cost = 10; cd = 5000; }
          else if (abilityName === 'heal' && (state.abilityCooldowns['heal'] || 0) <= 0) { cost = 20; cd = 10000; }

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
              
              if (abilityName === 'slash') {
                  gameState.current.player.slashAnim = 15;
                  state.socket.emit('use_ability', { ability: 'slash', facingRight: gameState.current.player.facingRight });
                  Sounds.sword();
              } else if (abilityName === 'fireball') {
                  const speed = 15;
                  const vx = gameState.current.player.facingRight ? speed : -speed;
                  state.socket.emit('fire_projectile', { type: 'fireball', x: gameState.current.player.x, y: gameState.current.player.y - 12, vx: vx, vy: 0, damage: 30 + (propsRef.current.skills?.intelligence || 0) * 3 });
                  Sounds.fireball();
              } else if (abilityName === 'heal') {
                  state.socket.emit('use_ability', { ability: 'heal' });
                  gameState.current.player.healAnim = 30;
                  Sounds.heal();
              }
          }
      };

      const handleCastAbilityEvent = (e: Event) => {
         const detail = (e as CustomEvent).detail;
         castAbility(detail.abilityId);
      };
      window.addEventListener('cast_ability', handleCastAbilityEvent);
      // We will need to remove this event listener at the end of the effect.
      // We can attach it to a ref or just keep it simple. Actually, we should add it in the same place as other event listeners, and remove it in the cleanup.

      // We'll store it on window for cleanup.
      (window as any)._lastHandleCastAbilityEvent = handleCastAbilityEvent;

      // MMO Abilities (from Keybinds)
      const abilityName = propsRef.current.keybinds?.[key];
      if (abilityName) {
         castAbility(abilityName);
      }
"""
    lines = lines[:start_idx] + new_block.split('\n') + lines[end_idx:]

cleanup_idx = -1
for i, line in enumerate(lines):
    if "window.removeEventListener('keydown', handleKeyDown);" in line:
        cleanup_idx = i
        break
if cleanup_idx != -1:
    lines.insert(cleanup_idx, "      if ((window as any)._lastHandleCastAbilityEvent) window.removeEventListener('cast_ability', (window as any)._lastHandleCastAbilityEvent);")


open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))
