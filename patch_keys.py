lines = open('src/components/GameCanvas.tsx').read().split('\n')
for i, line in enumerate(lines):
    if "if ((key === 'z' || key === 'x' || key === 'c') && gameState.current.globalCooldown <= 0" in line:
        lines[i] = "      if ((key === 'z' || key === 'x' || key === 'c') && gameState.current.globalCooldown <= 0 && gameState.current.socket) {"
    elif "if (key === 'z' && (state.abilityCooldowns['slash']" in line:
        lines[i] = "          if (key === 'z' && state.targetId && (state.abilityCooldowns['slash'] || 0) <= 0) { cost = 0; cd = 3000; abilityName = 'slash'; }"
    elif "else if (key === 'x' && (state.abilityCooldowns['fireball']" in line:
        lines[i] = "          else if (key === 'x' && state.targetId && (state.abilityCooldowns['fireball'] || 0) <= 0) { cost = 10; cd = 5000; abilityName = 'fireball'; }"
open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))
