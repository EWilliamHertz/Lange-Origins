lines = open('server.ts').read().split('\n')
for i in range(len(lines)):
    if "} else if (data.ability === 'whirlwind') {" in lines[i]:
        lines.insert(i, "          }")
        break
open('server.ts', 'w').write('\n'.join(lines))
