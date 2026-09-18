lines = open('src/components/GameCanvas.tsx').read().split('\n')
for i in range(880, 895):
    if "state.autoAttackTimer = 1500;" in lines[i]:
        lines.insert(i, "                      state.slashAnim = 15;")
        lines.insert(i+1, "                      playAudio('sword');")
        lines.insert(i+2, "                      player.facingRight = player.x < targetObj.x;")
        break

open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))
