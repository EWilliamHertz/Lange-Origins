import re
with open('src/components/GameCanvas.tsx', 'r') as f:
    content = f.read()

# First, add the playSound function at the top of Game Canvas
play_sound_code = """
const playSound = (type: string) => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        if (type === 'hit') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'slash') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        } else if (type === 'fireball') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        } else if (type === 'heal') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.15);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }
    } catch (e) {}
};
"""

content = content.replace("export default function Game({", play_sound_code + "\nexport default function Game({")

# Replace the ability keydown handler
ability_old = """      // MMO Abilities
      if ((key === 'z' || key === 'x' || key === 'c') && gameState.current.globalCooldown <= 0 && gameState.current.socket) {
          const state = gameState.current;
          let cost = 0;
          let cd = 0;
          let abilityName = '';
          if (key === 'z' && state.targetId && (state.abilityCooldowns['slash'] || 0) <= 0) { cost = 0; cd = 3000; abilityName = 'slash'; }
          else if (key === 'x' && state.targetId && (state.abilityCooldowns['fireball'] || 0) <= 0) { cost = 10; cd = 5000; abilityName = 'fireball'; }
          else if (key === 'c' && (state.abilityCooldowns['heal'] || 0) <= 0) { cost = 20; cd = 10000; abilityName = 'heal'; }
          
          if (abilityName !== '') {
              // Note: actual cost logic would hook into props, but for now just send event
              state.socket.emit('use_ability', { ability: abilityName, targetId: state.targetId, targetType: state.targetType });
              state.globalCooldown = 1500;
              state.abilityCooldowns[abilityName] = cd;
          }
      }"""

ability_new = """      // MMO Abilities
      const abilityName = propsRef.current.keybinds?.[key];
      if (abilityName && gameState.current.globalCooldown <= 0 && gameState.current.socket) {
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
                      propsRef.current.onManaChange(propsRef.current.mana - cost);
                  }
              }
              state.globalCooldown = 500; // 0.5s GCD
              state.abilityCooldowns[abilityName] = cd;
              
              if (abilityName === 'slash') {
                  gameState.current.player.slashAnim = 15;
                  state.socket.emit('use_ability', { ability: 'slash', facingRight: gameState.current.player.facingRight });
                  playSound('slash');
              } else if (abilityName === 'fireball') {
                  const speed = 15;
                  const vx = gameState.current.player.facingRight ? speed : -speed;
                  state.socket.emit('fire_projectile', { type: 'fireball', x: gameState.current.player.x, y: gameState.current.player.y - 12, vx: vx, vy: 0, damage: 30 + (propsRef.current.skills?.intelligence || 0) * 3 });
                  playSound('fireball');
              } else if (abilityName === 'heal') {
                  state.socket.emit('use_ability', { ability: 'heal' });
                  gameState.current.player.healAnim = 30;
                  playSound('heal');
              }
          }
      }"""
content = content.replace(ability_old, ability_new)

# Force immediate attack when clicking mob
force_attack = """               hitMob = true;
               
               if (state.autoAttackTimer > 0) state.autoAttackTimer = 0;"""
content = content.replace("               hitMob = true;", force_attack)

# Play sound on melee attack
melee_attack = """                      // Deal Damage
                      state.socket.emit('player_attack', { targetId: state.targetId, targetType: state.targetType, damage: finalDmg, knockback: dx > 0 ? 5 : -5 });
                      playSound('hit');"""
content = content.replace("                      // Deal Damage\n                      state.socket.emit('player_attack', { targetId: state.targetId, targetType: state.targetType, damage: finalDmg, knockback: dx > 0 ? 5 : -5 });", melee_attack)

with open('src/components/GameCanvas.tsx', 'w') as f:
    f.write(content)
