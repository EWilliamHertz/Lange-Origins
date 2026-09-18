lines = open('server.ts').read().split('\n')
for i in range(len(lines)):
    if "'damage_indicator', {" in lines[i]:
        # we append isPlayer: ...
        pass
    # I'll just use sed to replace 'damage_indicator', { id: Math.random().toString(), x: m.x, y: m.y, damage } with { ..., damage, isPlayer: false }
