lines = open('src/components/GameCanvas.tsx').read().split('\n')
idx = next(i for i, line in enumerate(lines) if "socket.on('take_damage'" in line)

heal_code = """
    socket.on('heal', (data: { amount: number }) => {
      const p = gameState.current.player;
      const maxHp = 20 + (propsRef.current.skills?.strength || 0) * 10;
      p.health = Math.min(maxHp, p.health + data.amount);
      propsRef.current.onHealthChange(p.health);
    });
"""
lines.insert(idx, heal_code)
open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))
