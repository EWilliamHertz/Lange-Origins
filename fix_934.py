lines = open('server.ts').read().split('\n')
for i in range(len(lines)):
    if "          };" in lines[i] and "          }" in lines[i+1] and "} else if (data.ability === 'fireball'" in lines[i+2]:
        del lines[i+1]
        break
open('server.ts', 'w').write('\n'.join(lines))
