lines = open('server.ts').read().split('\n')
for i in range(len(lines)):
    if "else if (p.type !== 'fireball' && p.type !== 'trap' && p.type !== 'frostbolt') p.vy += 0.1;" in lines[i]:
        lines[i] = "         else if (p.type !== 'fireball' && p.type !== 'trap' && p.type !== 'frostbolt' && p.type !== 'arcane_blast') p.vy += 0.1;"
    if "life: data.type === 'trap' ? 1000 : (data.type === 'grenade' ? 60 : (data.type === 'fireball' || data.type === 'frostbolt' ? 80 : 40))," in lines[i]:
        lines[i] = "                life: data.type === 'trap' ? 1000 : (data.type === 'grenade' ? 60 : (data.type === 'fireball' || data.type === 'frostbolt' || data.type === 'arcane_blast' ? 80 : (data.type === 'poison_arrow' ? 45 : 40))),"

open('server.ts', 'w').write('\n'.join(lines))

lines = open('src/components/GameCanvas.tsx').read().split('\n')
for i in range(len(lines)):
    if "        } else if (proj.type === 'trap') {" in lines[i]:
        insert = """
        } else if (proj.type === 'arcane_blast') {
          ctx.fillStyle = '#AB47BC'; // purple
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.type === 'poison_arrow') {
          ctx.fillStyle = '#8D6E63'; // brown shaft
          ctx.fillRect(-6, -1, 12, 2);
          ctx.fillStyle = '#66BB6A'; // green head
          ctx.beginPath();
          ctx.moveTo(6, -1);
          ctx.lineTo(10, 0);
          ctx.lineTo(6, 1);
          ctx.fill();
"""
        lines.insert(i, insert)
        break
open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))
