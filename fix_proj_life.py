lines = open('server.ts').read().split('\n')
for i in range(len(lines)):
    if "else if (p.type !== 'fireball') p.vy += 0.1;" in lines[i]:
        lines[i] = "         else if (p.type !== 'fireball' && p.type !== 'trap' && p.type !== 'frostbolt') p.vy += 0.1;"
    if "life: data.type === 'grenade' ? 60 : (data.type === 'fireball' ? 80 : 40)," in lines[i]:
        lines[i] = "                life: data.type === 'trap' ? 1000 : (data.type === 'grenade' ? 60 : (data.type === 'fireball' || data.type === 'frostbolt' ? 80 : 40)),"
        break
open('server.ts', 'w').write('\n'.join(lines))
